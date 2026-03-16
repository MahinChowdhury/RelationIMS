using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Services
{
    public class InventoryValueJob
    {
        private readonly ILogger<InventoryValueJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public InventoryValueJob(
            ILogger<InventoryValueJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateInventoryValue()
        {
            _logger.LogInformation("Inventory Value Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await UpdateCurrentValueAsync(context);
                await UpdateLastMonthValueAsync(context);

                _logger.LogInformation("Inventory Value Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating inventory value");
                throw;
            }
        }

        private async Task UpdateCurrentValueAsync(ApplicationDbContext context)
        {
            var currentValue = await context.ProductItems
                .Include(pi => pi.ProductVariant)
                .ThenInclude(pv => pv!.Product)
                .Where(pi => !pi.IsSold && !pi.IsDefected && pi.ProductVariant != null && pi.ProductVariant.Product != null)
                .GroupBy(pi => 1)
                .Select(g => new
                {
                    TotalItems = g.Count(),
                    TotalValue = g.Sum(pi => pi.ProductVariant!.Product!.CostPrice)
                })
                .FirstOrDefaultAsync();

            var inventoryValue = new InventoryValue
            {
                TotalItems = currentValue?.TotalItems ?? 0,
                TotalValue = currentValue?.TotalValue ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await SaveInventoryValueAsync(context, inventoryValue);
            _logger.LogInformation("Updated Current Inventory Value: Items={Items}, Value={Value}", inventoryValue.TotalItems, inventoryValue.TotalValue);
        }

        private async Task UpdateLastMonthValueAsync(ApplicationDbContext context)
        {
            var lastMonthStart = DateTime.UtcNow.AddMonths(-1);
            var lastMonthEnd = DateTime.UtcNow.AddMonths(-1);
            lastMonthEnd = new DateTime(lastMonthEnd.Year, lastMonthEnd.Month, DateTime.DaysInMonth(lastMonthEnd.Year, lastMonthEnd.Month), 23, 59, 59, DateTimeKind.Utc);

            var currentValue = await context.ProductItems
                .Include(pi => pi.ProductVariant)
                .ThenInclude(pv => pv!.Product)
                .Where(pi => !pi.IsSold && !pi.IsDefected && pi.ProductVariant != null && pi.ProductVariant.Product != null)
                .GroupBy(pi => 1)
                .Select(g => new
                {
                    TotalItems = g.Count(),
                    TotalValue = g.Sum(pi => pi.ProductVariant!.Product!.CostPrice)
                })
                .FirstOrDefaultAsync();

            var existingRecord = await context.InventoryValues
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync();

            if (existingRecord != null)
            {
                existingRecord.LastMonthValue = currentValue?.TotalValue ?? 0;
                existingRecord.UpdatedAt = DateTime.UtcNow;
                await context.SaveChangesAsync();
                _logger.LogInformation("Updated Last Month Value: {Value}", existingRecord.LastMonthValue);
            }
        }

        private async Task SaveInventoryValueAsync(ApplicationDbContext context, InventoryValue inventoryValue)
        {
            var existing = await context.InventoryValues
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.TotalItems = inventoryValue.TotalItems;
                existing.TotalValue = inventoryValue.TotalValue;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                inventoryValue.CreatedAt = DateTime.UtcNow;
                await context.InventoryValues.AddAsync(inventoryValue);
            }

            await context.SaveChangesAsync();
        }
    }
}
