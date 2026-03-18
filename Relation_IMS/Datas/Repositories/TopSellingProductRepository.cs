using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class TopSellingProductRepository : ITopSellingProductRepository
    {
        private readonly ApplicationDbContext _context;

        public TopSellingProductRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<TopSellingProduct>> GetTopSellingProductsAsync(TopSellingPeriodType periodType, int count = 20)
        {
            return await _context.TopSellingProducts
                .Where(p => p.PeriodType == periodType)
                .OrderByDescending(p => p.TotalQuantitySold)
                .Take(count)
                .ToListAsync();
        }

        public async Task UpdateTopSellingProductsAsync(TopSellingPeriodType periodType, List<TopSellingProduct> products)
        {
            // Remove existing records for this period
            var existingRecords = await _context.TopSellingProducts
                .Where(p => p.PeriodType == periodType)
                .ToListAsync();
            
            _context.TopSellingProducts.RemoveRange(existingRecords);
            
            // Add new records
            await _context.TopSellingProducts.AddRangeAsync(products);
            
            await _context.SaveChangesAsync();
        }
    }
}
