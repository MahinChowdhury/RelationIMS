using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ISalesOverviewRepository
    {
        Task<SalesOverview?> GetSalesOverviewAsync(SalesOverviewPeriodType periodType);
        Task UpdateSalesOverviewAsync(SalesOverviewPeriodType periodType, SalesOverview salesOverview);
    }
}
