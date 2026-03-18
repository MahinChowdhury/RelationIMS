using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class TopCustomerRepository : ITopCustomerRepository
    {
        private readonly ApplicationDbContext _context;

        public TopCustomerRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TopCustomer>> GetTopCustomersAsync(TopCustomerPeriodType periodType, int count = 10)
        {
            return await _context.TopCustomers
                .Where(t => t.PeriodType == periodType)
                .OrderByDescending(t => t.TotalAmount)
                .Take(count)
                .ToListAsync();
        }

        public async Task UpdateTopCustomersAsync(TopCustomerPeriodType periodType, List<TopCustomer> customers)
        {
            var existingRecords = await _context.TopCustomers
                .Where(t => t.PeriodType == periodType)
                .ToListAsync();
            
            _context.TopCustomers.RemoveRange(existingRecords);
            
            await _context.TopCustomers.AddRangeAsync(customers);
            
            await _context.SaveChangesAsync();
        }
    }
}
