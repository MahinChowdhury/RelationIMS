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
        private readonly Relation_IMS.Services.IConcurrencyLockService _lockService;
        private readonly ITodaySaleRepository _todaySaleRepository;

        public OrderRepository(
            ApplicationDbContext context, 
            IMapper mapper, 
            Relation_IMS.Services.IConcurrencyLockService lockService,
            ITodaySaleRepository todaySaleRepository)
        {
            _context = context;
            _mapper = mapper;
            _lockService = lockService;
            _todaySaleRepository = todaySaleRepository;
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

            // Update Today's Sale if payment is completed
            if (newOrder.PaymentStatus == PaymentStatus.Paid)
            {
                await _todaySaleRepository.IncrementTodaySaleAsync(DateTime.UtcNow, newOrder.NetAmount);
            }

            // Reserve inventory for each order item with concurrency locks
            if (newOrder.OrderItems != null && newOrder.OrderItems.Any())
            {
                // Group by variant to avoid multiple locks for the same variant in one order
                var itemsByVariant = newOrder.OrderItems
                    .Where(i => i.ProductVariantId.HasValue)
                    .GroupBy(i => i.ProductVariantId!.Value);

                foreach (var group in itemsByVariant)
                {
                    var variantId = group.Key;
                    var totalQuantity = group.Sum(i => i.Quantity);

                    using (await _lockService.AcquireLockAsync($"variant_stock:{variantId}", TimeSpan.FromSeconds(10)))
                    {
                        var variant = await _context.ProductVariants.FindAsync(variantId);
                        if (variant != null)
                        {
                            variant.ReservedQuantity += totalQuantity;
                            await _context.SaveChangesAsync();
                        }
                    }
                }
            }

            return newOrder;
        }

        public async Task<Order?> DeleteOrderByIdAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return null;

            // Release reserved inventory for each order item
            if (order.OrderItems != null && order.OrderItems.Any())
            {
                foreach (var item in order.OrderItems)
                {
                    if (item.ProductVariantId.HasValue)
                    {
                        var variant = await _context.ProductVariants.FindAsync(item.ProductVariantId.Value);
                        if (variant != null && variant.ReservedQuantity > 0)
                        {
                            // Only release up to the quantity that was actually arranged (not yet sold)
                            var releaseQty = item.Quantity - (item.ArrangedQuantity > 0 ? item.ArrangedQuantity : 0);
                            variant.ReservedQuantity = Math.Max(0, variant.ReservedQuantity - releaseQty);
                        }
                    }
                }
            }

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return order;
        }

        public async Task<List<Order>> GetAllOrdersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20, DateTime? startDate = null, DateTime? endDate = null)
        {

            var query = _context.Orders.AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt.Date >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(o => o.CreatedAt.Date <= endDate.Value.Date);
            }

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

        public async Task<List<Order>> GetOrderByCustomerIdAsync(int customerId, int? status = null, int? year = null, int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.Orders.Where(o => o.CustomerId == customerId);

            if (status.HasValue)
            {
                query = query.Where(o => (int)o.PaymentStatus == status.Value);
            }

            if (year.HasValue)
            {
                query = query.Where(o => o.CreatedAt.Year == year.Value);
            }

            var orders = await query
                .OrderByDescending(o => o.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return orders;
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            var order = await _context.Orders
                .Include(x => x.OrderItems!)
                    .ThenInclude(oi => oi.ProductVariant!)
                        .ThenInclude(pv => pv!.Size)
                .Include(x => x.OrderItems!)
                    .ThenInclude(oi => oi.ProductVariant!)
                        .ThenInclude(pv => pv!.Color)
                .Include(x => x.Customer)
                .Include(x => x.Payments)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (order == null) return null;

            return order;
        }

        public async Task<Order?> UpdateOrderByIdAsync(int id, UpdateOrderDTO updateDto)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Payments)
                .FirstOrDefaultAsync(o => o.Id == id);
            
            if (order == null) return null;

            // Update Basic Info
            order.CustomerId = updateDto.CustomerId;
            order.TotalAmount = updateDto.TotalAmount;
            order.Discount = updateDto.Discount;
            order.NetAmount = updateDto.NetAmount;
            order.UserId = updateDto.UserId;
            order.Remarks = updateDto.Remarks;

            // Only update InternalStatus if not confirming via this generic update, usually handled separately, but kept for flexibility
            if (updateDto.InternalStatus.HasValue)
            {
                order.InternalStatus = updateDto.InternalStatus.Value;
            }

            // Update Order Items if Provided
            if (updateDto.OrderItems != null)
            {
                // Release old reservations
                foreach (var oldItem in order.OrderItems!)
                {
                    if (oldItem.ProductVariantId.HasValue)
                    {
                        var variant = await _context.ProductVariants.FindAsync(oldItem.ProductVariantId.Value);
                        if (variant != null && variant.ReservedQuantity > 0)
                        {
                            var releaseQty = oldItem.Quantity - (oldItem.ArrangedQuantity > 0 ? oldItem.ArrangedQuantity : 0);
                            variant.ReservedQuantity = Math.Max(0, variant.ReservedQuantity - Math.Max(0, releaseQty));
                        }
                    }
                }

                // Remove existing items
                _context.OrderItems.RemoveRange(order.OrderItems!);
                
                // Add new items
                var newItems = _mapper.Map<List<OrderItem>>(updateDto.OrderItems);
                foreach (var item in newItems)
                {
                    item.OrderId = order.Id; // Ensure link
                    item.Id = 0; 
                    
                    // Reserve new quantities
                    if (item.ProductVariantId.HasValue)
                    {
                        var variant = await _context.ProductVariants.FindAsync(item.ProductVariantId.Value);
                        if (variant != null)
                        {
                            variant.ReservedQuantity += item.Quantity;
                        }
                    }
                }
                await _context.OrderItems.AddRangeAsync(newItems);
            }

            // Update Payments if Provided
            if (updateDto.Payments != null)
            {
                // Store old payment status
                var oldPaymentStatus = order.PaymentStatus;

                // Remove existing payments
                _context.OrderPayments.RemoveRange(order.Payments!);

                // Add new payments
                var newPayments = _mapper.Map<List<OrderPayment>>(updateDto.Payments);
                foreach(var payment in newPayments)
                {
                    payment.OrderId = order.Id;
                    payment.Id = 0;
                }
                await _context.OrderPayments.AddRangeAsync(newPayments);

                // Recalculate Payment Status
                order.PaidAmount = newPayments.Sum(p => p.Amount);
                if (order.PaidAmount >= order.NetAmount)
                {
                    order.PaymentStatus = PaymentStatus.Paid;
                }
                else if (order.PaidAmount > 0)
                {
                    order.PaymentStatus = PaymentStatus.Partial;
                }
                else
                {
                    order.PaymentStatus = PaymentStatus.Pending;
                }

                // Update Today's Sale if payment status changed to Paid
                if (oldPaymentStatus != PaymentStatus.Paid && order.PaymentStatus == PaymentStatus.Paid)
                {
                    await _todaySaleRepository.IncrementTodaySaleAsync(DateTime.UtcNow, order.NetAmount);
                }
            }

            await _context.SaveChangesAsync();

            return order;
        }
    }
}
