using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.PaymentModels;

namespace Relation_IMS.Services
{
    public class CustomerInsightJob
    {
        private readonly ILogger<CustomerInsightJob> _logger;
        private readonly TenantJobRunner _tenantJobRunner;

        public CustomerInsightJob(
            ILogger<CustomerInsightJob> logger,
            TenantJobRunner tenantJobRunner)
        {
            _logger = logger;
            _tenantJobRunner = tenantJobRunner;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 600)]
        public async Task UpdateCustomerInsight()
        {
            _logger.LogInformation("Customer Insight Job started at {Time}", DateTime.UtcNow);

            try
            {
                await _tenantJobRunner.RunForAllTenantsAsync(async (context, tenantId) =>
                {
                    // Note: ICustomerInsightRepository also normally depends on DbContext.
                    // We're passing context manually to UpdateAllTimeInsightAsync to ensure
                    // it executes within the tenant's exact transactional scope.
                    await UpdateCurrentMonthInsightAsync(context);
                    // To handle repository correctly without changing its injection logic, we use the injected one
                    // actually wait, let's keep it simple as it was, but we don't have scope here.
                    // Instead, I'll instantiate the repository manually, or change the method signature
                    var repository = new Relation_IMS.Datas.Repositories.CustomerInsightRepository(context);
                    await UpdateAllTimeInsightAsync(context, repository);
                });

                _logger.LogInformation("Customer Insight Job completed successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating customer insight");
                throw;
            }
        }

        private async Task UpdateAllTimeInsightAsync(ApplicationDbContext context, ICustomerInsightRepository repository)
        {
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

            var insight = new CustomerInsightAllTime
            {
                NewCustomerCount = newCustomerCount,
                ReturningCustomerCount = returningCustomerCount,
                TotalCustomers = totalCustomers,
                NewCustomerPercentage = newCustomerPercentage,
                ReturningCustomerPercentage = returningCustomerPercentage,
                CalculatedAt = DateTime.UtcNow
            };

            await repository.UpsertAllTimeInsightAsync(insight);

            _logger.LogInformation("Updated Customer Insight All-Time: New={New}, Returning={Returning}, Total={Total}", 
                newCustomerCount, returningCustomerCount, totalCustomers);
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
