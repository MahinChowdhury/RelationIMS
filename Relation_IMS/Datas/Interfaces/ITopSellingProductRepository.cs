using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ITopSellingProductRepository
    {
        Task<List<TopSellingProduct>> GetTopSellingProductsAsync(TopSellingPeriodType periodType, int count = 20);
        Task UpdateTopSellingProductsAsync(TopSellingPeriodType periodType, List<TopSellingProduct> products);
    }
}
