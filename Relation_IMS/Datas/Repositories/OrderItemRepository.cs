using AutoMapper;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Services;

namespace Relation_IMS.Datas.Repositories
{
    public class OrderItemRepository : IOrderItemRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly IConcurrencyLockService _lockService;

        public OrderItemRepository(ApplicationDbContext context , IMapper mapper, IConcurrencyLockService lockService)
        {
            _context = context;
            _mapper = mapper;
            _lockService = lockService;
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

            // Update global variant reserved quantity
            if (orderItem.ProductVariantId.HasValue)
            {
                using (await _lockService.AcquireLockAsync($"variant_stock:{orderItem.ProductVariantId.Value}", TimeSpan.FromSeconds(10)))
                {
                    var variant = await _context.ProductVariants.FindAsync(orderItem.ProductVariantId.Value);
                    if (variant != null)
                    {
                        variant.ReservedQuantity += orderItem.Quantity;
                        await _context.SaveChangesAsync();
                    }
                }
            }

            // Mark specific ProductItems as Sold AND Link them to this OrderItem
            if (orderItemDto.ProductItemIds != null && orderItemDto.ProductItemIds.Any())
            {
                // CRITICAL: Lock each product item to prevent concurrent assignment to multiple orders
                // We need to lock items in a consistent order to prevent deadlocks
                var sortedItemIds = orderItemDto.ProductItemIds.OrderBy(id => id).ToList();
                
                // Acquire locks for all items (sorted to prevent deadlock)
                var lockDisposables = new List<IDisposable>();
                try
                {
                    foreach (var itemId in sortedItemIds)
                    {
                        var lockDisposable = await _lockService.AcquireLockAsync($"productitem:{itemId}");
                        lockDisposables.Add(lockDisposable);
                    }

                    var productItems = await _context.ProductItems
                        .Where(p => orderItemDto.ProductItemIds.Contains(p.Id))
                        .ToListAsync();
                    
                    // Validate that none of the items are already assigned
                    var alreadyAssigned = productItems.Where(p => p.OrderItemId != null).ToList();
                    if (alreadyAssigned.Any())
                    {
                        throw new InvalidOperationException(
                            $"Product items already assigned to orders: {string.Join(", ", alreadyAssigned.Select(p => p.Code))}");
                    }
                    
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
                finally
                {
                    // Release all locks in reverse order
                    for (int i = lockDisposables.Count - 1; i >= 0; i--)
                    {
                        lockDisposables[i].Dispose();
                    }
                }
            }

            return orderItem;
        }

        public async Task<OrderItem?> DeleteOrderItemsByIdAsync(int id)
        {
            var orderItem = await _context.OrderItems.FindAsync(id);
            if (orderItem == null) return null;

            // Unlink any specifically arranged product items to avoid foreign key constraint violations
            var linkedProductItems = await _context.ProductItems
                .Where(pi => pi.OrderItemId == id)
                .ToListAsync();

            foreach (var pi in linkedProductItems)
            {
                pi.OrderItemId = null;
                pi.IsSold = false; // Return to available inventory
            }

            if (orderItem.ProductVariantId.HasValue)
            {
                using (await _lockService.AcquireLockAsync($"variant_stock:{orderItem.ProductVariantId.Value}", TimeSpan.FromSeconds(10)))
                {
                    var variant = await _context.ProductVariants.FindAsync(orderItem.ProductVariantId.Value);
                    if (variant != null && variant.ReservedQuantity > 0)
                    {
                        var releaseQty = orderItem.Quantity - (orderItem.ArrangedQuantity > 0 ? orderItem.ArrangedQuantity : 0);
                        variant.ReservedQuantity = Math.Max(0, variant.ReservedQuantity - Math.Max(0, releaseQty));
                        await _context.SaveChangesAsync();
                    }
                }
            }

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

            // Adjust reserved quantity if quantity changed, assuming variant didn't change (frontend edit mode doesn't change variant)
            if (orderItem.ProductVariantId.HasValue && orderItem.Quantity != updateDto.Quantity)
            {
                using (await _lockService.AcquireLockAsync($"variant_stock:{orderItem.ProductVariantId.Value}", TimeSpan.FromSeconds(10)))
                {
                    var variant = await _context.ProductVariants.FindAsync(orderItem.ProductVariantId.Value);
                    if (variant != null)
                    {
                        int difference = updateDto.Quantity - orderItem.Quantity;
                        variant.ReservedQuantity += difference;
                        
                        // Prevent negative reservations just in case
                        if (variant.ReservedQuantity < 0) {
                            variant.ReservedQuantity = 0;
                        }
                        await _context.SaveChangesAsync();
                    }
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

        public async Task<List<OrderItem>> GetOrderItemsByProductIdAsync(int productId, int? shopNoFilter = null, int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.OrderItems.Where(oi => oi.ProductId == productId);
            
            if (shopNoFilter.HasValue)
            {
                query = query.Where(oi => oi.Order!.ShopNo == shopNoFilter.Value);
            }

            var items = await query
                .Include(oi => oi.Order!)
                    .ThenInclude(o => o.Customer)
                .Include(oi => oi.ProductVariant!)
                    .ThenInclude(pv => pv!.Color)
                .Include(oi => oi.ProductVariant!)
                    .ThenInclude(pv => pv!.Size)
                .OrderByDescending(oi => oi.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return items;
        }
    }
}
