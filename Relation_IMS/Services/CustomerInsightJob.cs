using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.PaymentModels;

namespace Relation_IMS.Services
{
    public class CustomerInsightJob
    {
        private readonly ILogger<CustomerInsightJob> _logger;
        private readonly IServiceScopeFactory _scopeFactory;

        public CustomerInsightJob(
            ILogger<CustomerInsightJob> logger,
            IServiceScopeFactory scopeFactory)
        {
            _logger = logger;
            _scopeFactory = scopeFactory;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateCustomerInsight()
        {
            _logger.LogInformation("Customer Insight Job started at {Time}", DateTime.UtcNow);

            try
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await UpdateCurrentMonthInsightAsync(context);

                _logger.LogInformation("Customer Insight Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating customer insight");
                throw;
            }
        }

        private async Task UpdateCurrentMonthInsightAsync(ApplicationDbContext context)
        {
            var now = DateTime.UtcNow;
            var year = now.Year;
            var month = now.Month;

            var allOrders = await context.Orders
                .Where(o => o.PaymentStatus == PaymentStatus.Paid)
                .Select(o => o.CustomerId)
                .ToListAsync();

            var customerOrderCounts = allOrders
                .GroupBy(c => c)
                .ToDictionary(g => g.Key, g => g.Count());

            var newCustomerCount = customerOrderCounts.Count(c => c.Value == 1);
            var returningCustomerCount = customerOrderCounts.Count(c => c.Value > 1);
            var totalCustomers = customerOrderCounts.Count;

            decimal newCustomerPercentage = totalCustomers > 0 
                ? Math.Round((decimal)newCustomerCount / totalCustomers * 100, 2) 
                : 0;
            decimal returningCustomerPercentage = totalCustomers > 0 
                ? Math.Round((decimal)returningCustomerCount / totalCustomers * 100, 2) 
                : 0;

            var existing = await context.CustomerInsights
                .Where(c => c.Year == year && c.Month == month)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.NewCustomerCount = newCustomerCount;
                existing.ReturningCustomerCount = returningCustomerCount;
                existing.TotalCustomers = totalCustomers;
                existing.NewCustomerPercentage = newCustomerPercentage;
                existing.ReturningCustomerPercentage = returningCustomerPercentage;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var insight = new CustomerInsight
                {
                    Year = year,
                    Month = month,
                    NewCustomerCount = newCustomerCount,
                    ReturningCustomerCount = returningCustomerCount,
                    TotalCustomers = totalCustomers,
                    NewCustomerPercentage = newCustomerPercentage,
                    ReturningCustomerPercentage = returningCustomerPercentage,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await context.CustomerInsights.AddAsync(insight);
            }

            await context.SaveChangesAsync();
            _logger.LogInformation("Updated Customer Insight for {Year}-{Month}: New={New}, Returning={Returning}, Total={Total}", 
                year, month, newCustomerCount, returningCustomerCount, totalCustomers);
        }
    }
}
