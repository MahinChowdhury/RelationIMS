using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IOrderItemRepository
    {
        Task<OrderItem?> GetOrderItemsByIdAsync(int id);
        Task<OrderItem?> DeleteOrderItemsByIdAsync(int id);
        Task<OrderItem> CreateNewOrderItemAsync(CreateOrderItemDTO orderItemDto);
        Task<OrderItem?> UpdateOrderItemByIdAsync(int id,UpdateOrderItemDTO updateDto);
        Task<List<OrderItem>> GetOrderItemsByProductIdAsync(int productId, int? shopNoFilter = null, int pageNumber = 1, int pageSize = 20);
    }
}
