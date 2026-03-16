using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IStaffPerformanceRepository
    {
        Task<List<StaffPerformanceMonthly>> GetMonthlyPerformanceAsync(int year, int month);
    }
}
