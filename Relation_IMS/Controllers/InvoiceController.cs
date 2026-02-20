using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Entities;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class InvoiceController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InvoiceController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Get full invoice data for a given order — includes customer, order items,
        /// product details (name, category, brand), variant info (color, size), and payments.
        /// </summary>
        [HttpGet("{orderId:int}")]
        public async Task<IActionResult> GetInvoiceByOrderId([FromRoute] int orderId)
        {
            var order = await _context.Set<Models.OrderModels.Order>()
                .Include(o => o.Customer)
                .Include(o => o.User)
                .Include(o => o.Payments)
                .Include(o => o.OrderItems)!
                    .ThenInclude(oi => oi.Product)
                        .ThenInclude(p => p!.Category)
                .Include(o => o.OrderItems)!
                    .ThenInclude(oi => oi.Product)
                        .ThenInclude(p => p!.Brand)
                .Include(o => o.OrderItems)!
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(pv => pv!.Color)
                .Include(o => o.OrderItems)!
                    .ThenInclude(oi => oi.ProductVariant)
                        .ThenInclude(pv => pv!.Size)
                .AsSplitQuery()
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
            {
                return NotFound(new { message = $"Order with id: {orderId} not found." });
            }

            // Build a flat DTO so the frontend doesn't need to chase navigation properties
            var invoice = new
            {
                order.Id,
                OrderDate = order.CreatedAt,
                order.TotalAmount,
                order.Discount,
                order.NetAmount,
                order.PaidAmount,
                DueAmount = order.NetAmount - order.PaidAmount,
                PaymentStatus = order.PaymentStatus.ToString(),
                order.Remarks,
                Customer = order.Customer == null ? null : new
                {
                    order.Customer.Id,
                    order.Customer.Name,
                    order.Customer.Phone,
                    order.Customer.Address,
                    order.Customer.ShopName,
                    order.Customer.ShopAddress,
                },
                SoldBy = order.User == null ? null : new
                {
                    order.User.Id,
                    Name = $"{order.User.Firstname} {order.User.Lastname}".Trim()
                },
                Items = order.OrderItems?.Select(oi => new
                {
                    oi.Id,
                    ProductName = oi.Product?.Name ?? "Unknown",
                    CategoryName = oi.Product?.Category?.Name,
                    BrandName = oi.Product?.Brand?.Name,
                    ColorName = oi.ProductVariant?.Color?.Name,
                    SizeName = oi.ProductVariant?.Size?.Name,
                    oi.Quantity,
                    oi.UnitPrice,
                    oi.CostPrice,
                    oi.Discount,
                    oi.Subtotal,
                }).ToList(),
                Payments = order.Payments?.Select(p => new
                {
                    p.Id,
                    Method = p.PaymentMethod.ToString(),
                    p.Amount,
                    p.Note,
                }).ToList(),
            };

            return Ok(invoice);
        }
    }
}
