using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IOrderItemRepository
    {
        Task<List<OrderItem>> GetOrderItemsByOrderIdAsync(int id);
    }
}
