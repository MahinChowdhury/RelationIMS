using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Services
{
    public class TopCustomersJob
    {
        private readonly ILogger<TopCustomersJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public TopCustomersJob(
            ILogger<TopCustomersJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateTopCustomers()
        {
            _logger.LogInformation("Top Customers Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await UpdateAllTimeAsync(context);

                _logger.LogInformation("Top Customers Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating top customers");
                throw;
            }
        }

        private async Task UpdateAllTimeAsync(ApplicationDbContext context)
        {
            var topCustomers = await context.Orders
                .Include(o => o.Customer)
                .Where(o => o.Customer != null)
                .GroupBy(o => new { o.CustomerId, o.Customer!.Name })
                .Select(g => new
                {
                    CustomerId = g.Key.CustomerId,
                    CustomerName = g.Key.Name,
                    TotalPurchases = g.Count(),
                    TotalAmount = g.Sum(o => o.NetAmount)
                })
                .OrderByDescending(x => x.TotalAmount)
                .Take(10)
                .ToListAsync();

            var entities = topCustomers.Select(c => new TopCustomer
            {
                CustomerId = c.CustomerId,
                CustomerName = c.CustomerName,
                TotalPurchases = c.TotalPurchases,
                TotalAmount = c.TotalAmount,
                PeriodType = TopCustomerPeriodType.AllTime,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }).ToList();

            var existing = await context.TopCustomers
                .Where(t => t.PeriodType == TopCustomerPeriodType.AllTime)
                .ToListAsync();
            
            context.TopCustomers.RemoveRange(existing);
            await context.TopCustomers.AddRangeAsync(entities);
            await context.SaveChangesAsync();

            _logger.LogInformation("Updated Top Customers - All Time: {Count} customers", entities.Count);
        }
    }
}
