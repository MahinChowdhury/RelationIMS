using Microsoft.EntityFrameworkCore;
using Relation_IMS.Models;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.InventoryModels;
using Relation_IMS.Models.JWTModels;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.PaymentModels;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Entities;
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
        
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
            new Role { Id = 1, Name = "User", Description = "Regular user role" },
            new Role { Id = 2, Name = "Admin", Description = "Administrator role" },
            new Role { Id = 3, Name = "Editor", Description = "Editor Role" }
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
}