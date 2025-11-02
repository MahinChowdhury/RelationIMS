using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.OrderDtos;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class OrderController : ControllerBase
    {
        private readonly IOrderRepository _repo;
        public OrderController(IOrderRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<ActionResult<List<Order>>> GetAllOrdersAsync() {
            var orders = await _repo.GetAllOrdersAsync();
            return Ok(orders);
        }
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Order>> GetOrderById([FromRoute] int id) {
            var order = await _repo.GetOrderByIdAsync(id);
            if (order == null) {
                return NotFound(new { message = $"Orders with id : {id} not found." });
            }

            return Ok(order);
        }
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Order>> DeleteOrderByIdAsync([FromRoute] int id)
        {
            var order = await _repo.DeleteOrderByIdAsync(id);
            if (order == null)
            {
                return NotFound(new { message = $"Orders with id : {id} not found." });
            }

            return Ok(order);
        }

        [HttpPost]
        public async Task<ActionResult<Order>> CreateNewOrderAsync(CreateOrderDTO orderDto) {
            var created = await _repo.CreateNewOrderAsync(orderDto);

            return CreatedAtAction(nameof(GetOrderById), new { id = created!.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<Order>> UpdateOrderByIdAsync([FromRoute] int id, UpdateOrderDTO updateDto) {
            var updated = await _repo.UpdateOrderByIdAsync(id, updateDto);

            return Ok(updated);
        }
    }
}
