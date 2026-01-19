using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ArrangementController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ArrangementController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetPendingArrangementOrders()
        {
            // Show only orders where InternalStatus != Confirmed
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.Product)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(pv => pv.Size)
                .Include(o => o.OrderItems)
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(pv => pv.Color)
                .Where(o => o.InternalStatus != OrderInternalStatus.Confirmed)
                .OrderByDescending(o => o.CreatedAt)
                .ToListAsync();

            return Ok(orders);
        }

        [HttpPost("scan")]
        public async Task<IActionResult> ScanItemForArrangement([FromBody] ArrangementScanRequestDTO request)
        {
            var order = await _context.Orders.FindAsync(request.OrderId);
            if (order == null) return NotFound("Order not found");

            if (order.InternalStatus == OrderInternalStatus.Confirmed)
                return BadRequest("Order is already confirmed.");

            // Find the item by barcode
            var productItem = await _context.ProductItems
                .Include(pi => pi.ProductVariant)
                    .ThenInclude(pv => pv.Product)
                .FirstOrDefaultAsync(pi => pi.Code == request.Barcode);

            if (productItem == null)
            {
                return NotFound($"Item with barcode '{request.Barcode}' not found.");
            }

            if (productItem.IsSold || productItem.IsDefected)
            {
                return BadRequest($"Item '{request.Barcode}' is already Sold or Defected.");
            }

            // Check if already reserved for ANY order (including this one, to prevent double counting if logic allows)
            if (productItem.OrderItemId != null)
            {
                // If it's this order, maybe they scanned it twice?
                // Depending on UI, we might want to allow "re-scan to verify" or "error already scanned".
                // User said "add my barcode scans... should add those in items".
                // If I scan twice, I shouldn't increment quantity twice for same physical item.
                var existingOi = await _context.OrderItems.FindAsync(productItem.OrderItemId);
                if (existingOi?.OrderId == request.OrderId)
                    return BadRequest($"Item '{request.Barcode}' is already scanned for this order.");
                else
                    return BadRequest($"Item '{request.Barcode}' is reserved for another order.");
            }

            // Find matching OrderItem in this order
            // Match Logic: OrderId matches AND Product/Variant matches
            var orderItems = await _context.OrderItems
                .Where(oi => oi.OrderId == request.OrderId && oi.ProductId == productItem.ProductVariant.ProductId)
                .ToListAsync();

            // Refine match by Variant if possible
            OrderItem? matchingOrderItem = null;

            // Scenario 1: OrderItem has specific VariantId
            matchingOrderItem = orderItems.FirstOrDefault(oi => oi.ProductVariantId == productItem.ProductVariantId);

            // Scenario 2: OrderItem has No VariantId (older data?) -> Match purely on ProductId
            if (matchingOrderItem == null)
            {
                 matchingOrderItem = orderItems.FirstOrDefault(oi => oi.ProductVariantId == null);
            }

            if (matchingOrderItem == null)
            {
                return BadRequest($"This item (Product: {productItem.ProductVariant.Product?.Name ?? "Unknown"}, Variant: {productItem.ProductVariantId}) is not required in this order.");
            }

            if (matchingOrderItem.ArrangedQuantity >= matchingOrderItem.Quantity)
            {
                return BadRequest("Required quantity for this item is already fulfilled.");
            }

            // Logic: Link to OrderItem (Reserve), Increment ArrangedQty
            // DO NOT set IsSold yet (User Request: "upon confirming IsSold true")
            productItem.OrderItemId = matchingOrderItem.Id;
            matchingOrderItem.ArrangedQuantity += 1;

            // Update Status to Arranging if it was Created
            if (order.InternalStatus == OrderInternalStatus.Created)
            {
                order.InternalStatus = OrderInternalStatus.Arranging;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                Message = "Item verified and reserved.",
                OrderItemId = matchingOrderItem.Id,
                ArrangedQuantity = matchingOrderItem.ArrangedQuantity,
                RequiredQuantity = matchingOrderItem.Quantity
            });
        }

        [HttpPost("confirm/{orderId}")]
        public async Task<IActionResult> ConfirmArrangement(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null) return NotFound("Order not found");

            // Check if all items are fully arranged
            bool allArranged = order.OrderItems.All(oi => oi.ArrangedQuantity >= oi.Quantity);

            // User said "at last check if quantites match"
            if (!allArranged)
            {
                return BadRequest("Cannot confirm arrangement. Not all items are fully arranged.");
            }

            // Mark all reserved items as Sold
            var reservedItems = await _context.ProductItems
                .Include(pi => pi.OrderItem)
                .Where(pi => pi.OrderItem != null && pi.OrderItem.OrderId == orderId)
                .ToListAsync();

            foreach (var item in reservedItems)
            {
                item.IsSold = true;
            }

            order.InternalStatus = OrderInternalStatus.Confirmed;  
            // NOTE: Status flow might be Created -> Arranging -> Arranged -> Confirmed (Payment/Delivery?)
            // If "Confirm Arrangement" means moving to "Arranged", then this is correct.

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Order arrangement confirmed. Items marked as sold.", InternalStatus = order.InternalStatus });
        }

        [HttpGet("items/{orderId}")]
        public async Task<IActionResult> GetArrangedItems(int orderId)
        {
            var items = await _context.ProductItems
                .Include(pi => pi.ProductVariant)
                .Where(pi => pi.OrderItemId != null && pi.OrderItem!.OrderId == orderId)
                .Select(pi => new
                {
                    pi.Code,
                    ProductName = pi.ProductVariant!.Product!.Name,
                    Variant = pi.ProductVariant,
                    pi.IsSold
                })
                .ToListAsync();

            return Ok(items);
        }
    }

    public class ArrangementScanRequestDTO
    {
        [Required]
        public int OrderId { get; set; }
        [Required]
        public string Barcode { get; set; } = string.Empty;
    }
}
