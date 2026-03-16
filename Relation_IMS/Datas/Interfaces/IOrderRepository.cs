using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IOrderRepository
    {
        Task<List<Order>> GetAllOrdersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20, DateTime? startDate = null, DateTime? endDate = null);
        Task<Order?> GetOrderByIdAsync(int id);
        Task<Order?> DeleteOrderByIdAsync(int id);
        Task<Order?> CreateNewOrderAsync(CreateOrderDTO orderDto);
        Task<Order?> UpdateOrderByIdAsync(int id,UpdateOrderDTO updateDto);
        Task<List<OrderItem>> GetItemsByOrderIdAsync(int id);
        Task<List<Order>> GetOrderByCustomerIdAsync(int customerId, int? status = null, int? year = null, int pageNumber = 1, int pageSize = 20);
    }
}
