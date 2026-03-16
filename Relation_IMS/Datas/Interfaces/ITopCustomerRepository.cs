using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ITopCustomerRepository
    {
        Task<List<TopCustomer>> GetTopCustomersAsync(TopCustomerPeriodType periodType, int count = 10);
        Task UpdateTopCustomersAsync(TopCustomerPeriodType periodType, List<TopCustomer> customers);
    }
}
