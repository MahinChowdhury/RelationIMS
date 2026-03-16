using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ITodaySaleRepository
    {
        Task<TodaySale?> GetTodaySaleAsync(DateTime date);
        Task<TodaySale?> GetYesterdaySaleAsync(DateTime yesterday);
        Task UpdateTodaySaleAsync(DateTime date, decimal amount, int orderCount);
        Task IncrementTodaySaleAsync(DateTime date, decimal amount);
    }
}
