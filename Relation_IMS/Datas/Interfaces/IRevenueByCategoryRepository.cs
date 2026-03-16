using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IRevenueByCategoryRepository
    {
        Task<List<RevenueByCategory>> GetRevenueByCategoriesAsync(TopSellingPeriodType periodType, int count = 10);
        Task UpdateRevenueByCategoriesAsync(TopSellingPeriodType periodType, List<RevenueByCategory> categories);
    }
}
