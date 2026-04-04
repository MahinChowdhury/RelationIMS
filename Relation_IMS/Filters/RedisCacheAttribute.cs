using Finbuckle.MultiTenant;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Relation_IMS.Models;
using Relation_IMS.Services;
using System.Text;
using System.Text.Json;

namespace Relation_IMS.Filters
{
    /// <summary>
    /// Action filter that caches GET responses in Redis with tenant isolation.
    /// Usage: [RedisCache("category")] on GET endpoints.
    /// Cache key format: {tenantId}:{prefix}:{path}:{sorted_query_params}
    /// Default TTL: 15 minutes.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class RedisCacheAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string _prefix;
        private readonly int _ttlSeconds;

        public RedisCacheAttribute(string prefix, int ttlSeconds = 900) // 900s = 15 min
        {
            _prefix = prefix;
            _ttlSeconds = ttlSeconds;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            IRedisCacheService? cacheService = null;
            string? cacheKey = null;

            try
            {
                cacheService = context.HttpContext.RequestServices.GetRequiredService<IRedisCacheService>();
                cacheKey = GenerateCacheKey(context.HttpContext);
                Console.WriteLine($"[RedisCache] Checking cache for key: {cacheKey}");

                // Try to get from cache
                var cachedResponse = await cacheService.GetCachedResponseAsync(cacheKey);
                
                if (!string.IsNullOrEmpty(cachedResponse))
                {
                    Console.WriteLine($"[RedisCache] Cache HIT for key: {cacheKey}");
                    // Return cached response
                    context.Result = new ContentResult
                    {
                        Content = cachedResponse,
                        ContentType = "application/json",
                        StatusCode = 200
                    };
                    return;
                }
                Console.WriteLine($"[RedisCache] Cache MISS for key: {cacheKey}");
            }
            catch (Exception)
            {
                // Redis unavailable — fall through to execute the action normally
            }

            // Execute the action
            var executedContext = await next();

            // Only cache successful responses (2xx)
            if (cacheService != null && cacheKey != null &&
                executedContext.Result is ObjectResult objectResult &&
                objectResult.StatusCode >= 200 && objectResult.StatusCode < 300)
            {
                try
                {
                    var responseJson = JsonSerializer.Serialize(objectResult.Value, new JsonSerializerOptions
                    {
                        PropertyNamingPolicy = null,
                        ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles
                    });

                    await cacheService.SetCacheResponseAsync(cacheKey, responseJson, TimeSpan.FromSeconds(_ttlSeconds));
                }
                catch (Exception)
                {
                    // Redis unavailable — skip caching, response already sent to client
                }
            }
        }

        private string GenerateCacheKey(HttpContext httpContext)
        {
            var sb = new StringBuilder();

            // Prepend tenant identifier for data isolation
            var tenantInfo = httpContext.GetMultiTenantContext<AppTenantInfo>()?.TenantInfo;
            var tenantId = tenantInfo?.Identifier ?? "default";
            sb.Append(tenantId);
            sb.Append(':');

            sb.Append(_prefix);
            sb.Append(':');
            sb.Append(httpContext.Request.Path.ToString().ToLowerInvariant());

            // Append ShopNo to isolate cache per shop
            var shopClaim = httpContext.User?.Claims?.FirstOrDefault(c => c.Type == "ShopNo")?.Value;
            if (!string.IsNullOrEmpty(shopClaim))
            {
                sb.Append(":shop_");
                sb.Append(shopClaim);
            }
            else
            {
                // Fallback for unauthenticated or users without ShopNo claim
                sb.Append(":shop_global");
            }

            if (httpContext.Request.QueryString.HasValue)
            {
                // Sort query params for consistent keys
                var sortedParams = httpContext.Request.Query
                    .OrderBy(q => q.Key)
                    .Select(q => $"{q.Key}={q.Value}")
                    .ToList();

                sb.Append('?');
                sb.Append(string.Join("&", sortedParams));
            }

            return sb.ToString();
        }
    }
}
