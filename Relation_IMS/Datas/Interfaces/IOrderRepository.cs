using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IOrderRepository
    {
        Task<List<Order>> GetAllOrdersAsync();
        Task<Order?> GetOrderByIdAsync(int id);
        Task<Order?> DeleteOrderByIdAsync(int id);
        Task<Order?> CreateNewOrderAsync(CreateOrderDTO orderDto);
        Task<Order?> UpdateOrderByIdAsync(int id,UpdateOrderDTO updateDto);
    }
}
