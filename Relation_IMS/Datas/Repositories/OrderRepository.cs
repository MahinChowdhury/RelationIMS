using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.PaymentModels;

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

            // Calculate Paid Amount from Payments if any
            if (newOrder.Payments != null && newOrder.Payments.Any())
            {
                newOrder.PaidAmount = newOrder.Payments.Sum(p => p.Amount);
            }
            else
            {
                newOrder.PaidAmount = 0;
            }

            // Determine Payment Status
            if (newOrder.PaidAmount >= newOrder.NetAmount)
            {
                newOrder.PaymentStatus = PaymentStatus.Paid;
            }
            else if (newOrder.PaidAmount > 0)
            {
                newOrder.PaymentStatus = PaymentStatus.Partial;
            }
            else
            {
                newOrder.PaymentStatus = PaymentStatus.Pending;
            }

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
                .OrderByDescending(o => o.Id)
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
                .Include(x => x.Payments)
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
