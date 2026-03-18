using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.PaymentModels;

namespace Relation_IMS.Services
{
    public class SalesOverviewJob
    {
        private readonly ILogger<SalesOverviewJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public SalesOverviewJob(
            ILogger<SalesOverviewJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateSalesOverview()
        {
            _logger.LogInformation("Sales Overview Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await UpdateThisWeekAsync(context);
                await UpdateThisMonthAsync(context);

                _logger.LogInformation("Sales Overview Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating sales overview");
                throw;
            }
        }

        private async Task UpdateThisWeekAsync(ApplicationDbContext context)
        {
            var now = DateTime.UtcNow;
            var startOfWeek = now.Date.AddDays(-(int)now.DayOfWeek + (int)DayOfWeek.Monday);
            if (now.DayOfWeek == DayOfWeek.Sunday)
                startOfWeek = startOfWeek.AddDays(-7);

            var stats = await context.Orders
                .Where(o => o.PaymentStatus == PaymentStatus.Paid && o.CreatedAt >= startOfWeek)
                .GroupBy(o => 1)
                .Select(g => new
                {
                    TotalRevenue = g.Sum(o => o.NetAmount),
                    OrderCount = g.Count()
                })
                .FirstOrDefaultAsync();

            var salesOverview = new SalesOverview
            {
                TotalRevenue = stats?.TotalRevenue ?? 0,
                OrderCount = stats?.OrderCount ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await UpdateOrCreateAsync(context, SalesOverviewPeriodType.ThisWeek, salesOverview);
            _logger.LogInformation("Updated Sales Overview - This Week: Revenue={Revenue}, Orders={OrderCount}", salesOverview.TotalRevenue, salesOverview.OrderCount);
        }

        private async Task UpdateThisMonthAsync(ApplicationDbContext context)
        {
            var now = DateTime.UtcNow;
            var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

            var stats = await context.Orders
                .Where(o => o.PaymentStatus == PaymentStatus.Paid && o.CreatedAt >= startOfMonth)
                .GroupBy(o => 1)
                .Select(g => new
                {
                    TotalRevenue = g.Sum(o => o.NetAmount),
                    OrderCount = g.Count()
                })
                .FirstOrDefaultAsync();

            var salesOverview = new SalesOverview
            {
                TotalRevenue = stats?.TotalRevenue ?? 0,
                OrderCount = stats?.OrderCount ?? 0,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await UpdateOrCreateAsync(context, SalesOverviewPeriodType.ThisMonth, salesOverview);
            _logger.LogInformation("Updated Sales Overview - This Month: Revenue={Revenue}, Orders={OrderCount}", salesOverview.TotalRevenue, salesOverview.OrderCount);
        }

        private async Task UpdateOrCreateAsync(ApplicationDbContext context, SalesOverviewPeriodType periodType, SalesOverview salesOverview)
        {
            var existing = await context.SalesOverviews
                .Where(s => s.PeriodType == periodType)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.TotalRevenue = salesOverview.TotalRevenue;
                existing.OrderCount = salesOverview.OrderCount;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                salesOverview.PeriodType = periodType;
                await context.SalesOverviews.AddAsync(salesOverview);
            }

            await context.SaveChangesAsync();
        }
    }
}
