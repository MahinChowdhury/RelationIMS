using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Datas.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public OrderRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Order?> CreateNewOrderAsync(CreateOrderDTO orderDto)
        {
            var newOrder = _mapper.Map<Order>(orderDto);

            await _context.Orders.AddAsync(newOrder);
            await _context.SaveChangesAsync();

            return newOrder;
        }

        public async Task<Order?> DeleteOrderByIdAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return null;

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return order;
        }

        public async Task<List<Order>> GetAllOrdersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20)
        {

            var query = _context.Orders.AsQueryable();

            var orders = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Include(c => c.Customer)
                .ToListAsync();

            return orders;
        }

        public async Task<List<OrderItem>> GetItemsByOrderIdAsync(int id)
        {
            var items = await _context.OrderItems.Where(o => o.OrderId == id).ToListAsync();

            return items;
        }

        public async Task<List<Order>> GetOrderByCustomerIdAsync(int customerId)
        {
            var orders = await _context.Orders.Where(o => o.CustomerId == customerId).ToListAsync();

            return orders;
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            var order = await _context.Orders
                .Include(x => x.OrderItems)
                .Include(x => x.Customer)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (order == null) return null;

            return order;
        }

        public async Task<Order?> UpdateOrderByIdAsync(int id, UpdateOrderDTO updateDto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return null;

            order.CustomerId = updateDto.CustomerId;
            order.TotalAmount = updateDto.TotalAmount;
            order.Discount = updateDto.Discount;
            order.NetAmount = updateDto.NetAmount;
            order.UserId = updateDto.UserId;
            order.Remarks = updateDto.Remarks;

            await _context.SaveChangesAsync();

            return order;
        }
    }
}
