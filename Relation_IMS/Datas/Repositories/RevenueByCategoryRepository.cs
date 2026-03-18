using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class RevenueByCategoryRepository : IRevenueByCategoryRepository
    {
        private readonly ApplicationDbContext _context;

        public RevenueByCategoryRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<RevenueByCategory>> GetRevenueByCategoriesAsync(TopSellingPeriodType periodType, int count = 10)
        {
            return await _context.RevenueByCategories
                .Where(r => r.PeriodType == periodType)
                .OrderByDescending(r => r.TotalRevenue)
                .Take(count)
                .ToListAsync();
        }

        public async Task UpdateRevenueByCategoriesAsync(TopSellingPeriodType periodType, List<RevenueByCategory> categories)
        {
            var existingRecords = await _context.RevenueByCategories
                .Where(r => r.PeriodType == periodType)
                .ToListAsync();
            
            _context.RevenueByCategories.RemoveRange(existingRecords);
            
            await _context.RevenueByCategories.AddRangeAsync(categories);
            
            await _context.SaveChangesAsync();
        }
    }
}
