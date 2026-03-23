using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Services
{
    public class TopSellingProductsJob
    {
        private readonly ILogger<TopSellingProductsJob> _logger;
        private readonly TenantJobRunner _tenantJobRunner;

        public TopSellingProductsJob(
            ILogger<TopSellingProductsJob> logger,
            TenantJobRunner tenantJobRunner)
        {
            _logger = logger;
            _tenantJobRunner = tenantJobRunner;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateTopSellingProducts()
        {
            _logger.LogInformation("Top Selling Products Job started at {Time}", DateTime.UtcNow);

            try
            {
                await _tenantJobRunner.RunForAllTenantsAsync(async (context, tenantId) =>
                {
                    // Update Last 30 Days
                    await UpdateLast30DaysAsync(context);

                    // Update This Quarter
                    await UpdateThisQuarterAsync(context);
                });

                _logger.LogInformation("Top Selling Products Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating top selling products");
                throw;
            }
        }

        private async Task UpdateLast30DaysAsync(ApplicationDbContext context)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;

            var topProducts = await context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order != null && oi.Product != null && oi.Order.CreatedAt >= thirtyDaysAgo)
                .GroupBy(oi => new { oi.ProductId, oi.Product!.Name, oi.Product.ImageUrls })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    ProductImageUrl = g.Key.ImageUrls != null && g.Key.ImageUrls.Any() ? g.Key.ImageUrls.First() : null,
                    TotalQuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Subtotal)
                })
                .OrderByDescending(x => x.TotalQuantitySold)
                .Take(20)
                .ToListAsync();

            var entities = topProducts.Select(p => new TopSellingProduct
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ProductImageUrl = p.ProductImageUrl,
                TotalQuantitySold = p.TotalQuantitySold,
                TotalRevenue = p.TotalRevenue,
                PeriodType = TopSellingPeriodType.Last30Days,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            // Remove existing and insert new
            var existing = await context.TopSellingProducts
                .Where(t => t.PeriodType == TopSellingPeriodType.Last30Days)
                .ToListAsync();
            
            context.TopSellingProducts.RemoveRange(existing);
            await context.TopSellingProducts.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            _logger.LogInformation("Updated Last 30 Days: {Count} products", entities.Count);
        }

        private async Task UpdateThisQuarterAsync(ApplicationDbContext context)
        {
            // Calculate current quarter start
            var now = DateTime.UtcNow;
            var quarterStart = new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var topProducts = await context.OrderItems
                .Include(oi => oi.Product)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order != null && oi.Product != null && oi.Order.CreatedAt >= quarterStart)
                .GroupBy(oi => new { oi.ProductId, oi.Product!.Name, oi.Product.ImageUrls })
                .Select(g => new
                {
                    ProductId = g.Key.ProductId,
                    ProductName = g.Key.Name,
                    ProductImageUrl = g.Key.ImageUrls != null && g.Key.ImageUrls.Any() ? g.Key.ImageUrls.First() : null,
                    TotalQuantitySold = g.Sum(oi => oi.Quantity),
                    TotalRevenue = g.Sum(oi => oi.Subtotal)
                })
                .OrderByDescending(x => x.TotalQuantitySold)
                .Take(20)
                .ToListAsync();

            var entities = topProducts.Select(p => new TopSellingProduct
            {
                ProductId = p.ProductId,
                ProductName = p.ProductName,
                ProductImageUrl = p.ProductImageUrl,
                TotalQuantitySold = p.TotalQuantitySold,
                TotalRevenue = p.TotalRevenue,
                PeriodType = TopSellingPeriodType.ThisQuarter,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            // Remove existing and insert new
            var existing = await context.TopSellingProducts
                .Where(t => t.PeriodType == TopSellingPeriodType.ThisQuarter)
                .ToListAsync();
            
            context.TopSellingProducts.RemoveRange(existing);
            await context.TopSellingProducts.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            _logger.LogInformation("Updated This Quarter: {Count} products", entities.Count);
        }
    }
}
