using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class OrderItemController : ControllerBase
    {
        private readonly IOrderItemRepository _repo;
        private readonly IConcurrencyLockService _lockService;
        public OrderItemController(IOrderItemRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpGet("{id:int}")]
        [RedisCache("orderitem")]
        public async Task<ActionResult<OrderItem>> GetOrderItemById([FromRoute] int id) {
            var orderItem = await _repo.GetOrderItemsByIdAsync(id);

            if (orderItem == null) {
                return NotFound(new { message = $"orderItem with id : {id} not found."});
            }
            
            return Ok(orderItem);
        }
        [HttpDelete("{id:int}")]
        [InvalidateCache("orderitem", "order", "arrangement", "product", "productvariant")]
        public async Task<ActionResult<OrderItem>> DeleteOrderItemsById([FromRoute] int id)
        {
            // Fetch first to get OrderId
            var item = await _repo.GetOrderItemsByIdAsync(id);
            if (item == null)
            {
                return NotFound(new { message = $"orderItem with id : {id} not found." });
            }

            using (await _lockService.AcquireLockAsync($"order:{item.OrderId}"))
            {
                 // Re-check existence? optional but safer if deleted concurrently
                 // But repository delete usually handles null check too.
                var orderItem = await _repo.DeleteOrderItemsByIdAsync(id);

                if (orderItem == null) // Should not happen if item existed above, unless concurrent delete won
                {
                    return NotFound(new { message = $"orderItem with id : {id} not found." });
                }

                return Ok(orderItem);
            }
        }
        [HttpPost]
        [InvalidateCache("orderitem", "order", "arrangement", "product", "productvariant")]
        public async Task<ActionResult<OrderItem>> CreateNewOrderItem(CreateOrderItemDTO orderItemDto) {
            using (await _lockService.AcquireLockAsync($"order:{orderItemDto.OrderId}"))
            {
                var created = await _repo.CreateNewOrderItemAsync(orderItemDto);

                return CreatedAtAction(nameof(GetOrderItemById), new { id = created.Id }, created);
            }
        }
        [HttpPut("{id:int}")]
        [InvalidateCache("orderitem", "order", "arrangement", "product", "productvariant")]
        public async Task<ActionResult<OrderItem>> UpdateOrderItemById([FromRoute] int id, UpdateOrderItemDTO updateDto) {
             // Fetch first to get OrderId
            var item = await _repo.GetOrderItemsByIdAsync(id);
            if (item == null)
            {
                return NotFound(new { message = $"order Item by Id : {id} not found." });
            }
            
            using (await _lockService.AcquireLockAsync($"order:{item.OrderId}"))
            {
                var updated = await _repo.UpdateOrderItemByIdAsync(id, updateDto);
                if (updated == null) {
                    return NotFound(new { message = $"order Item by Id : {id} not found."});
                }

                return Ok(updated);
            }
        }

    }
}
