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
        private readonly ApplicationDbContext _repo;
        private readonly IMapper _mapper;
        public OrderRepository(ApplicationDbContext repo, IMapper mapper)
        {
            _repo = repo;
            _mapper = mapper;
        }

        public async Task<Order?> CreateNewOrderAsync(CreateOrderDTO orderDto)
        {
            var newOrder = _mapper.Map<Order>(orderDto);

            await _repo.Orders.AddAsync(newOrder);
            await _repo.SaveChangesAsync();

            return newOrder;
        }

        public async Task<Order?> DeleteOrderByIdAsync(int id)
        {
            var order = await _repo.Orders.FindAsync(id);
            if (order == null) return null;

            _repo.Orders.Remove(order);
            await _repo.SaveChangesAsync();

            return order;
        }

        public async Task<List<Order>> GetAllOrdersAsync()
        {
            var orders = await _repo.Orders.ToListAsync();
            return orders;
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            var order = await _repo.Orders.FindAsync(id);
            if (order == null) return null;
            return order;
        }

        public async Task<Order?> UpdateOrderByIdAsync(int id, UpdateOrderDTO updateDto)
        {
            var order = await _repo.Orders.FindAsync(id);
            if (order == null) return null;

            order.CustomerId = updateDto.CustomerId;
            order.TotalAmount = updateDto.TotalAmount;
            order.Discount = updateDto.Discount;
            order.NetAmount = updateDto.NetAmount;
            order.UserId = updateDto.UserId;
            order.Remarks = updateDto.Remarks;

            await _repo.SaveChangesAsync();

            return order;
        }
    }
}
