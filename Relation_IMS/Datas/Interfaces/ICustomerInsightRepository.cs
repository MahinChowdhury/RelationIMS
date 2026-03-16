using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ICustomerInsightRepository
    {
        Task<CustomerInsight?> GetMonthlyInsightAsync(int year, int month);
        Task<CustomerInsightAllTime?> GetAllTimeInsightAsync();
        Task UpsertAllTimeInsightAsync(CustomerInsightAllTime insight);
    }
}
