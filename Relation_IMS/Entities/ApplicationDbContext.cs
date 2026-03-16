using Microsoft.EntityFrameworkCore;
using Relation_IMS.Models;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.InventoryModels;
using Relation_IMS.Models.JWTModels;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.PaymentModels;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Models.UserProfileModels;
using Relation_IMS.Services;

namespace Relation_IMS.Entities;
public class ApplicationDbContext : DbContext
{
    private readonly ICurrentUserService? _currentUserService;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options, ICurrentUserService? currentUserService = null) : base(options)
    {
        _currentUserService = currentUserService;
    }

    // Auto-populate audit fields on save
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var userId = _currentUserService?.UserId;

        foreach (var entry in ChangeTracker.Entries<BaseAuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = userId;
                    break;

                case EntityState.Modified:
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = userId;
                    break;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    // Configure entity relationships, keys, and seed data
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // Define composite primary key for UserRole entity (join table for many-to-many)
        // This means the combination of UserId + RoleId uniquely identifies a UserRole record
        modelBuilder.Entity<UserRole>()
            .HasKey(ur => new { ur.UserId, ur.RoleId });
        // Configure relationship: UserRole -> User (many UserRoles belong to one User)
        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.User)
            .WithMany(u => u.UserRoles) // User can have many UserRoles
            .HasForeignKey(ur => ur.UserId); // Foreign key in UserRole points to User.Id
                                             // Configure relationship: UserRole -> Role (many UserRoles belong to one Role)
        modelBuilder.Entity<UserRole>()
            .HasOne(ur => ur.Role)
            .WithMany(r => r.UserRoles) // Role can have many UserRoles
            .HasForeignKey(ur => ur.RoleId); // Foreign key in UserRole points to Role.Id
                                             // Seed initial Role data in the database
        modelBuilder.Entity<Role>().HasData(
            new Role { Id = 1, Name = "Salesman", Description = "Salesman role" },
            new Role { Id = 2, Name = "Shop Manager", Description = "Shop Manager role" },
            new Role { Id = 3, Name = "Head Manager", Description = "Head Manager role" },
            new Role { Id = 4, Name = "Owner", Description = "Owner role" }
        );
        // Seed initial Client data for authentication (demo purposes)
        modelBuilder.Entity<Client>().HasData(
            new Client
            {
                Id = 1,
                ClientId = "client-app-one", // Unique client identifier used in JWT tokens
                Name = "Demo Client Application One",
                ClientSecret = "fPXxcJw8TW5sA+S4rl4tIPcKk+oXAqoRBo+1s2yjUS4=", // Base64-encoded secret key
                ClientURL = "https://clientappone.example.com", // Used as Audience in JWT validation
                IsActive = true // Active client flag
            },
            new Client
            {
                Id = 2,
                ClientId = "client-app-two",
                Name = "Demo Client Application Two",
                ClientSecret = "UkY2JEdtWqKFY5cEUuWqKZut2o6BI5cf3oexOlCMZvQ=",
                ClientURL = "https://clientapptwo.example.com",
                IsActive = true
            }
        );

        modelBuilder.Entity<Order>()
                .Property(i => i.PaymentStatus)
                .HasConversion<string>();
        modelBuilder.Entity<ProductDefect>()
            .Property(i => i.Status)
            .HasConversion<string>();

        // UserProfile: one-to-one with User
        modelBuilder.Entity<Relation_IMS.Models.UserProfileModels.UserProfile>()
            .HasIndex(up => up.UserId)
            .IsUnique();

        modelBuilder.Entity<Relation_IMS.Models.UserProfileModels.UserProfile>()
            .HasOne(up => up.User)
            .WithOne(u => u.UserProfile)
            .HasForeignKey<Relation_IMS.Models.UserProfileModels.UserProfile>(up => up.UserId);

        // SalaryRecord: many-to-one with User
        modelBuilder.Entity<Relation_IMS.Models.UserProfileModels.SalaryRecord>()
            .HasOne(s => s.User)
            .WithMany(u => u.SalaryRecords)
            .HasForeignKey(s => s.UserId);

        // SalaryRecord: unique constraint - no duplicate month/year for same user
        modelBuilder.Entity<Relation_IMS.Models.UserProfileModels.SalaryRecord>()
            .HasIndex(s => new { s.UserId, s.Month, s.Year })
            .IsUnique();
    }

    //For JWT
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<UserRole> UserRoles { get; set; } = null!;
    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    // For Products
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductVariant> ProductVariants { get; set; }
    public DbSet<ProductColor> ProductColors { get; set; }
    public DbSet<ProductSize> ProductSizes { get; set; }
    public DbSet<Brand> Brands { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Quarter> Quarters { get; set; }
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Order> Orders { get; set; }
    public DbSet<OrderItem> OrderItems { get; set; }
    public DbSet<ProductItem> ProductItems { get; set; }
    public DbSet<ProductDefect> ProductDefects { get; set; }
    public DbSet<Inventory> Inventories { get; set; }
    public DbSet<InventoryTransferRecord> InventoryTransferRecords { get; set; }
    public DbSet<InventoryTransferRecordItem> InventoryTransferRecordItems { get; set; }
    public DbSet<ProductLot> ProductLots { get; set; }
    public DbSet<OrderPayment> OrderPayments { get; set; }
    public DbSet<CustomerReturnRecord> CustomerReturnRecords { get; set; }
    public DbSet<CustomerReturnItem> CustomerReturnItems { get; set; }
    public DbSet<UserProfile> UserProfiles { get; set; }
    public DbSet<SalaryRecord> SalaryRecords { get; set; }
    public DbSet<ShareCatalog> ShareCatalogs { get; set; }
    public DbSet<TopSellingProduct> TopSellingProducts { get; set; }
    public DbSet<RevenueByCategory> RevenueByCategories { get; set; }
}