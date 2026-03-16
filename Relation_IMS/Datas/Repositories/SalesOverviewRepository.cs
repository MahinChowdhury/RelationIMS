using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Models.PaymentModels;

namespace Relation_IMS.Datas.Repositories
{
    public class SalesOverviewRepository : ISalesOverviewRepository
    {
        private readonly ApplicationDbContext _context;

        public SalesOverviewRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<SalesOverview?> GetSalesOverviewAsync(SalesOverviewPeriodType periodType)
        {
            return await _context.SalesOverviews
                .Where(s => s.PeriodType == periodType)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateSalesOverviewAsync(SalesOverviewPeriodType periodType, SalesOverview salesOverview)
        {
            var existing = await _context.SalesOverviews
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
                salesOverview.CreatedAt = DateTime.UtcNow;
                await _context.SalesOverviews.AddAsync(salesOverview);
            }

            await _context.SaveChangesAsync();
        }
    }
}
