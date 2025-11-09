using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class OrderItemController : ControllerBase
    {
        private readonly IOrderItemRepository _repo;
        public OrderItemController(IOrderItemRepository repo)
        {
            _repo = repo;
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<OrderItem>> GetOrderItemById([FromRoute] int id) {
            var orderItem = await _repo.GetOrderItemsByIdAsync(id);

            if (orderItem == null) {
                return NotFound(new { message = $"orderItem with id : {id} not found."});
            }
            
            return Ok(orderItem);
        }
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<OrderItem>> DeleteOrderItemsById([FromRoute] int id)
        {
            var orderItem = await _repo.DeleteOrderItemsByIdAsync(id);

            if (orderItem == null)
            {
                return NotFound(new { message = $"orderItem with id : {id} not found." });
            }

            return Ok(orderItem);
        }
        [HttpPost]
        public async Task<ActionResult<OrderItem>> CreateNewOrderItem(CreateOrderItemDTO orderItemDto) {
            var created = await _repo.CreateNewOrderItemAsync(orderItemDto);

            return CreatedAtAction(nameof(GetOrderItemById), new { id = created.Id }, created);
        }
        [HttpPut("{id:int}")]
        public async Task<ActionResult<OrderItem>> UpdateOrderItemById([FromRoute] int id, UpdateOrderItemDTO updateDto) {
            var updated = await _repo.UpdateOrderItemByIdAsync(id, updateDto);
            if (updated == null) {
                return NotFound(new { message = $"order Item by Id : {id} not found."});
            }

            return Ok(updated);
        }

    }
}
