using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Azure;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Datas.Repositories.ProductVariantsRepo;
using Relation_IMS.Entities;
using Relation_IMS.Factory;
using Relation_IMS.Hubs;
using Relation_IMS.Services;
using Relation_IMS.Services.AzureServices;
using Relation_IMS.Services.JWTServices;
using System.IdentityModel.Tokens.Jwt;
using System.IO.Compression;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// JSON Serialization
// ============================================
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.PropertyNamingPolicy = null;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ============================================
// Database
// ============================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
);

// ============================================
// Azure Storage
// ============================================
builder.Services.AddSingleton(x => new BlobServiceClient(builder.Configuration["AzureStorage:ConnectionString"]));
builder.Services.AddScoped<IAzureBlobService, AzureBlobService>();

// ============================================
// Caching (Memory + Redis)
// ============================================
builder.Services.AddMemoryCache();

// Rate Limiting
var rateLimitPermit = builder.Configuration.GetValue<int>("RateLimiting:PermitLimit", 100);
var rateLimitWindow = builder.Configuration.GetValue<int>("RateLimiting:WindowSeconds", 60);
var rateLimitQueue = builder.Configuration.GetValue<int>("RateLimiting:QueueLimit", 0);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("fixed", httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = rateLimitPermit,
                Window = TimeSpan.FromSeconds(rateLimitWindow),
                QueueLimit = rateLimitQueue
            }));
});

// Forwarded Headers (for Nginx reverse proxy)
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
});

// Redis Distributed Cache
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration["Redis:ConnectionString"];
    options.InstanceName = "RelationIMS:";
});
builder.Services.AddSingleton<StackExchange.Redis.IConnectionMultiplexer>(sp =>
    StackExchange.Redis.ConnectionMultiplexer.Connect(builder.Configuration["Redis:ConnectionString"]!));
builder.Services.AddSingleton<IRedisCacheService, RedisCacheService>();

builder.Services.AddSingleton<IClientCacheService, ClientCacheService>();

// ============================================
// User & Auth Services
// ============================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IUserService, UserService>();

// ============================================
// Repositories
// ============================================
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IQuarterRepository, QuarterRepository>();
builder.Services.AddScoped<IProductVariantRepository, ProductVariantRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductVariantColorRepository, ProductVariantColorRepository>();
builder.Services.AddScoped<IProductVariantSizeRepository, ProductVariantSizeRepository>();
builder.Services.AddScoped<IBrandRepository, BrandRepository>();
builder.Services.AddScoped<ICustomerRepository, CustomerRepository>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderItemRepository, OrderItemRepository>();
builder.Services.AddScoped<IInventoryRepository, InventoryRepository>();
builder.Services.AddScoped<ProductItemsBuilderFactory>();
builder.Services.AddScoped<IProductItemRepository, ProductItemRepository>();
builder.Services.AddScoped<IUserProfileRepository, UserProfileRepository>();
builder.Services.AddScoped<IShareCatalogRepository, ShareCatalogRepository>();
builder.Services.AddScoped<ProductCodeGenerator>();

// ============================================
// Concurrency & Background Services
// ============================================
builder.Services.AddSingleton<IConcurrencyLockService, ConcurrencyLockService>();

builder.Services.AddHostedService<BackgroundProductImageUploader>();
builder.Services.AddSingleton(System.Threading.Channels.Channel.CreateUnbounded<ProductImageUploadTask>());

// ============================================
// JWT Authentication
// ============================================
Lazy<IClientCacheService>? clientCacheInstance = null;

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["JwtSettings:Issuer"],
        ValidateAudience = false,
        ValidateIssuerSigningKey = true,
        ValidateLifetime = true,
        IssuerSigningKeyResolver = (token, securityToken, kid, validationParameters) =>
        {
            var jwtToken = new JwtSecurityToken(token);
            var clientId = jwtToken.Claims.FirstOrDefault(c => c.Type == "client_id")?.Value;

            if (string.IsNullOrEmpty(clientId) || clientCacheInstance == null)
                return Enumerable.Empty<SecurityKey>();

            var client = clientCacheInstance.Value.GetClientByClientIdAsync(clientId).Result;
            if (client == null)
                return Enumerable.Empty<SecurityKey>();

            var keyBytes = Convert.FromBase64String(client.ClientSecret);
            return new[] { new SymmetricSecurityKey(keyBytes) };
        }
    };

    options.Events = new JwtBearerEvents
    {
        OnTokenValidated = async context =>
        {
            var clientId = context.Principal?.FindFirst("client_id")?.Value;
            if (string.IsNullOrEmpty(clientId))
            {
                context.Fail("ClientId claim missing.");
                return;
            }
            if (clientCacheInstance == null)
            {
                context.Fail("Client Cache Instance is null");
                return;
            }

            var client = await clientCacheInstance.Value.GetClientByClientIdAsync(clientId);
            if (client == null)
            {
                context.Fail("Invalid client.");
                return;
            }
            var audClaim = context.Principal?.FindFirst(JwtRegisteredClaimNames.Aud)?.Value;
            if (audClaim != client.ClientURL)
            {
                context.Fail("Invalid audience.");
                return;
            }
        }
    };
});

// ============================================
// AutoMapper
// ============================================
builder.Services.AddAutoMapper(typeof(Program).Assembly);

// CORS - read allowed origins from configuration / environment
var corsOrigins = builder.Configuration["AllowedCorsOrigins"] ??
    "http://localhost:4200,http://localhost:5173,https://localhost:5173";

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowClientApps", policy =>
    {
        policy.WithOrigins(corsOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ============================================
// SignalR
// ============================================
builder.Services.AddSignalR();

// ============================================
// Azure Clients
// ============================================
builder.Services.AddAzureClients(clientBuilder =>
{
    clientBuilder.AddBlobServiceClient(builder.Configuration["StorageConnection:blobServiceUri"]!).WithName("StorageConnection");
    clientBuilder.AddQueueServiceClient(builder.Configuration["StorageConnection:queueServiceUri"]!).WithName("StorageConnection");
    clientBuilder.AddTableServiceClient(builder.Configuration["StorageConnection:tableServiceUri"]!).WithName("StorageConnection");
});

// ============================================
// Health Checks
// ============================================
builder.Services.AddHealthChecks()
    .AddNpgSql(
        builder.Configuration.GetConnectionString("DefaultConnection")!,
        name: "postgresql",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "db", "postgres" })
    .AddRedis(
        builder.Configuration["Redis:ConnectionString"]!,
        name: "redis",
        failureStatus: HealthStatus.Degraded,
        tags: new[] { "cache", "redis" });

// ============================================
// Response Compression
// ============================================
builder.Services.AddResponseCompression(options =>
{
    options.EnableForHttps = true;
    options.Providers.Add<BrotliCompressionProvider>();
    options.Providers.Add<GzipCompressionProvider>();
});

builder.Services.Configure<BrotliCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.Fastest);
builder.Services.Configure<GzipCompressionProviderOptions>(options =>
    options.Level = CompressionLevel.SmallestSize);

// ============================================
// Rate Limiting
// ============================================
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            }));
});

// ============================================
// Forwarded Headers (for reverse proxy / Docker)
// ============================================
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownIPNetworks.Clear();
    options.KnownProxies.Clear();
});

// ============================================
// Build the App
// ============================================
var app = builder.Build();

clientCacheInstance = new Lazy<IClientCacheService>(() =>
                app.Services.GetRequiredService<IClientCacheService>());

// Apply Database Migrations on Startup
using (var scope = app.Services.CreateScope())
{
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        if (dbContext.Database.IsRelational())
        {
            dbContext.Database.Migrate();
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while migrating the database.");
    }
}

// Configure the HTTP request pipeline.
app.UseForwardedHeaders();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRateLimiter();
app.UseCors("AllowClientApps");
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint (no auth, no rate limit)
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .AllowAnonymous()
    .ExcludeFromDescription();

app.MapControllers().RequireRateLimiting("fixed");
app.MapHub<ArrangementHub>("/hubs/arrangement");

app.Run();