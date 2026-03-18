using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.PaymentModels;

namespace Relation_IMS.Services
{
    public class StaffPerformanceJob
    {
        private readonly ILogger<StaffPerformanceJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public StaffPerformanceJob(
            ILogger<StaffPerformanceJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateStaffPerformance()
        {
            _logger.LogInformation("Staff Performance Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await UpdateCurrentMonthPerformanceAsync(context);

                _logger.LogInformation("Staff Performance Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating staff performance");
                throw;
            }
        }

        private async Task UpdateCurrentMonthPerformanceAsync(ApplicationDbContext context)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var year = now.Year;
            var month = now.Month;

            var stats = await context.Orders
                .Where(o => o.PaymentStatus == PaymentStatus.Paid && o.CreatedAt >= startOfMonth)
                .GroupBy(o => o.UserId)
                .Select(g => new
                {
                    UserId = g.Key,
                    TotalSales = g.Sum(o => o.NetAmount),
                    OrderCount = g.Count()
                })
                .OrderByDescending(x => x.TotalSales)
                .ToListAsync();

            var rank = 1;
            foreach (var stat in stats)
            {
                var existing = await context.StaffPerformanceMonthlies
                    .Where(s => s.UserId == stat.UserId && s.Year == year && s.Month == month)
                    .FirstOrDefaultAsync();

                if (existing != null)
                {
                    existing.TotalSales = stat.TotalSales;
                    existing.OrderCount = stat.OrderCount;
                    existing.Rank = rank;
                    existing.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    var newPerformance = new StaffPerformanceMonthly
                    {
                        UserId = stat.UserId,
                        Year = year,
                        Month = month,
                        TotalSales = stat.TotalSales,
                        OrderCount = stat.OrderCount,
                        Rank = rank,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await context.StaffPerformanceMonthlies.AddAsync(newPerformance);
                }

                rank++;
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Updated Staff Performance for {Year}-{Month}: {Count} staff members", year, month, stats.Count);
        }
    }
}
