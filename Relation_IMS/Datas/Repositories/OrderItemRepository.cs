using AutoMapper;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;
using System.Linq;
using Microsoft.EntityFrameworkCore;

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

            // Fetch Product to snapshot CostPrice and calculate Discount if needed
            var product = await _context.Products.FindAsync(orderItemDto.ProductId);
            if (product != null)
            {
                orderItem.CostPrice = product.CostPrice;
                
            // If Discount was not provided (0) but UnitPrice is less than BasePrice, calculate it
                if (orderItem.Discount == 0 && orderItem.UnitPrice < product.BasePrice)
                {
                    orderItem.Discount = product.BasePrice - orderItem.UnitPrice;
                }
            }
            
            // Set Variant ID if provided
            if (orderItemDto.ProductVariantId.HasValue)
            {
                orderItem.ProductVariantId = orderItemDto.ProductVariantId.Value;
            }

            // We must save OrderItem first to get its ID before linking ProductItems
            await _context.OrderItems.AddAsync(orderItem);
            await _context.SaveChangesAsync();

            // Mark specific ProductItems as Sold AND Link them to this OrderItem
            if (orderItemDto.ProductItemIds != null && orderItemDto.ProductItemIds.Any())
            {
                var productItems = await _context.ProductItems
                    .Where(p => orderItemDto.ProductItemIds.Contains(p.Id))
                    .ToListAsync();
                
                foreach (var item in productItems)
                {
                    item.IsSold = true;
                    item.OrderItemId = orderItem.Id; // Link physical item to order line
                }
                
                // If items were provided during creation, we assume they are "Arranged" immediately?
                // The new workflow implies "Arranging" happens LATER. 
                // However, the existing flow (CreateOrder.tsx) sends ProductItemIds.
                // If the user selects specific items at creation, they are effectively "Arranged".
                // But the requirement says "Show only orders where InternalStatus != Confirmed... Default statuses shown: Created, Arranging".
                // We should count them as arranged if they are linked.
                orderItem.ArrangedQuantity = productItems.Count;
                
                await _context.SaveChangesAsync();
            }

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

            // If Product changed, we should ideally update CostPrice, but primarily just map fields
            if (orderItem.ProductId != updateDto.ProductId)
            {
                 var product = await _context.Products.FindAsync(updateDto.ProductId);
                 if (product != null)
                 {
                     orderItem.CostPrice = product.CostPrice;
                 }
            }

            orderItem.OrderId = updateDto.OrderId;
            orderItem.ProductId = updateDto.ProductId;
            orderItem.Quantity = updateDto.Quantity;
            orderItem.UnitPrice = updateDto.UnitPrice;
            orderItem.Subtotal = updateDto.Subtotal;
            orderItem.Discount = updateDto.Discount;

            await _context.SaveChangesAsync();

            return orderItem;
        }
    }
}
