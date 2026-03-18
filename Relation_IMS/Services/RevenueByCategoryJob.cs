using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Services
{
    public class RevenueByCategoryJob
    {
        private readonly ILogger<RevenueByCategoryJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public RevenueByCategoryJob(
            ILogger<RevenueByCategoryJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateRevenueByCategory()
        {
            _logger.LogInformation("Revenue By Category Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                // Update Last 30 Days
                await UpdateLast30DaysAsync(context);

                // Update This Quarter
                await UpdateThisQuarterAsync(context);

                _logger.LogInformation("Revenue By Category Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating revenue by category");
                throw;
            }
        }

        private async Task UpdateLast30DaysAsync(ApplicationDbContext context)
        {
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30).Date;

            var revenueByCategory = await context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order != null && oi.Product != null && oi.Order.CreatedAt >= thirtyDaysAgo)
                .GroupBy(oi => new { oi.Product!.CategoryId, oi.Product!.Category!.Name })
                .Select(g => new
                {
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.Name,
                    TotalRevenue = g.Sum(oi => oi.Subtotal),
                    TotalQuantitySold = g.Sum(oi => oi.Quantity)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            var entities = revenueByCategory.Select(r => new RevenueByCategory
            {
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                TotalRevenue = r.TotalRevenue,
                TotalQuantitySold = r.TotalQuantitySold,
                PeriodType = TopSellingPeriodType.Last30Days,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            var existing = await context.RevenueByCategories
                .Where(r => r.PeriodType == TopSellingPeriodType.Last30Days)
                .ToListAsync();
            
            context.RevenueByCategories.RemoveRange(existing);
            await context.RevenueByCategories.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            _logger.LogInformation("Updated Revenue By Category - Last 30 Days: {Count} categories", entities.Count);
        }

        private async Task UpdateThisQuarterAsync(ApplicationDbContext context)
        {
            var now = DateTime.UtcNow;
            var quarterStart = new DateTime(now.Year, ((now.Month - 1) / 3) * 3 + 1, 1, 0, 0, 0, DateTimeKind.Utc);

            var revenueByCategory = await context.OrderItems
                .Include(oi => oi.Product)
                .ThenInclude(p => p!.Category)
                .Include(oi => oi.Order)
                .Where(oi => oi.Order != null && oi.Product != null && oi.Order.CreatedAt >= quarterStart)
                .GroupBy(oi => new { oi.Product!.CategoryId, oi.Product!.Category!.Name })
                .Select(g => new
                {
                    CategoryId = g.Key.CategoryId,
                    CategoryName = g.Key.Name,
                    TotalRevenue = g.Sum(oi => oi.Subtotal),
                    TotalQuantitySold = g.Sum(oi => oi.Quantity)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            var entities = revenueByCategory.Select(r => new RevenueByCategory
            {
                CategoryId = r.CategoryId,
                CategoryName = r.CategoryName,
                TotalRevenue = r.TotalRevenue,
                TotalQuantitySold = r.TotalQuantitySold,
                PeriodType = TopSellingPeriodType.ThisQuarter,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            var existing = await context.RevenueByCategories
                .Where(r => r.PeriodType == TopSellingPeriodType.ThisQuarter)
                .ToListAsync();
            
            context.RevenueByCategories.RemoveRange(existing);
            await context.RevenueByCategories.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            _logger.LogInformation("Updated Revenue By Category - This Quarter: {Count} categories", entities.Count);
        }
    }
}
