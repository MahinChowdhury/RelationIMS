using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class TodaySaleRepository : ITodaySaleRepository
    {
        private readonly ApplicationDbContext _context;

        public TodaySaleRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TodaySale?> GetTodaySaleAsync(DateTime date)
        {
            var dateOnly = date.Date;
            return await _context.TodaySales
                .Where(t => t.Date.Date == dateOnly)
                .FirstOrDefaultAsync();
        }

        public async Task<TodaySale?> GetYesterdaySaleAsync(DateTime yesterday)
        {
            var dateOnly = yesterday.Date;
            return await _context.TodaySales
                .Where(t => t.Date.Date == dateOnly)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateTodaySaleAsync(DateTime date, decimal amount, int orderCount)
        {
            var dateOnly = date.Date;
            var existing = await _context.TodaySales
                .Where(t => t.Date.Date == dateOnly)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.TotalSales = amount;
                existing.OrderCount = orderCount;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var todaySale = new TodaySale
                {
                    Date = dateOnly,
                    TotalSales = amount,
                    OrderCount = orderCount,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.TodaySales.AddAsync(todaySale);
            }

            await _context.SaveChangesAsync();
        }

        public async Task IncrementTodaySaleAsync(DateTime date, decimal amount)
        {
            var dateOnly = date.Date;
            var existing = await _context.TodaySales
                .Where(t => t.Date.Date == dateOnly)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.TotalSales += amount;
                existing.OrderCount += 1;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var todaySale = new TodaySale
                {
                    Date = dateOnly,
                    TotalSales = amount,
                    OrderCount = 1,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                await _context.TodaySales.AddAsync(todaySale);
            }

            await _context.SaveChangesAsync();
        }
    }
}
