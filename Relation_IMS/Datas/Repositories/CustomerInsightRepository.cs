using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class CustomerInsightRepository : ICustomerInsightRepository
    {
        private readonly ApplicationDbContext _context;

        public CustomerInsightRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<CustomerInsight?> GetMonthlyInsightAsync(int year, int month)
        {
            return await _context.CustomerInsights
                .Where(c => c.Year == year && c.Month == month)
                .FirstOrDefaultAsync();
        }

        public async Task<CustomerInsightAllTime?> GetAllTimeInsightAsync()
        {
            return await _context.CustomerInsightsAllTime
                .OrderByDescending(c => c.CalculatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task UpsertAllTimeInsightAsync(CustomerInsightAllTime insight)
        {
            var existing = await _context.CustomerInsightsAllTime.FirstOrDefaultAsync();
            if (existing != null)
            {
                existing.NewCustomerCount = insight.NewCustomerCount;
                existing.ReturningCustomerCount = insight.ReturningCustomerCount;
                existing.TotalCustomers = insight.TotalCustomers;
                existing.NewCustomerPercentage = insight.NewCustomerPercentage;
                existing.ReturningCustomerPercentage = insight.ReturningCustomerPercentage;
                existing.CalculatedAt = insight.CalculatedAt;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                insight.CreatedAt = DateTime.UtcNow;
                insight.UpdatedAt = DateTime.UtcNow;
                await _context.CustomerInsightsAllTime.AddAsync(insight);
            }
            await _context.SaveChangesAsync();
        }
    }
}
