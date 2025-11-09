using AutoMapper;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Repositories
{
    public class OrderItemRepository : IOrderItemRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public OrderItemRepository(ApplicationDbContext context , IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<OrderItem> CreateNewOrderItemAsync(CreateOrderItemDTO orderItemDto)
        {
            var orderItem = _mapper.Map<OrderItem>(orderItemDto);

            await _context.OrderItems.AddAsync(orderItem);
            await _context.SaveChangesAsync();

            return orderItem;
        }

        public async Task<OrderItem?> DeleteOrderItemsByIdAsync(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null) return null;

            _context.OrderItems.Remove(orderItem);
            await _context.SaveChangesAsync();

            return orderItem;
        }

        public async Task<OrderItem?> GetOrderItemsByIdAsync(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null) return null;

            return orderItem;
        }

        public async Task<OrderItem?> UpdateOrderItemByIdAsync(int id, UpdateOrderItemDTO updateDto)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null) return null;

            orderItem.OrderId = updateDto.OrderId;
            orderItem.ProductId = updateDto.ProductId;
            orderItem.Quantity = updateDto.Quantity;
            orderItem.UnitPrice = updateDto.UnitPrice;
            orderItem.Subtotal = updateDto.Subtotal;

            await _context.SaveChangesAsync();

            return orderItem;
        }
    }
}
