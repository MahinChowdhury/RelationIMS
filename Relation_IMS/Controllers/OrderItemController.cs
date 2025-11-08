using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
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

        [HttpGet("{orderId:int}")]
        public async Task<ActionResult<List<OrderItem>>> GetOrderItemsByOrderId([FromRoute] int id) {
            var orderItems = await _repo.GetOrderItemsByOrderIdAsync(id);
            if (orderItems == null) {
                return NotFound(new { message = $"Order id : {id} not found."});
            }
            return Ok(orderItems);
        }

    }
}
