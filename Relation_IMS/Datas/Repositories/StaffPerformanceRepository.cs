using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class StaffPerformanceRepository : IStaffPerformanceRepository
    {
        private readonly ApplicationDbContext _context;

        public StaffPerformanceRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<StaffPerformanceMonthly>> GetMonthlyPerformanceAsync(int year, int month)
        {
            return await _context.StaffPerformanceMonthlies
                .Include(s => s.User)
                .Where(s => s.Year == year && s.Month == month)
                .OrderBy(s => s.Rank)
                .Take(10)
                .ToListAsync();
        }
    }
}
