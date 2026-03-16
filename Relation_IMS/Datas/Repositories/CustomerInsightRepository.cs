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
    }
}
