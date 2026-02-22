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
    public class OrderController : ControllerBase
    {
        private readonly IOrderRepository _repo;
        private readonly IConcurrencyLockService _lockService;

        public OrderController(IOrderRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpGet]
        [RedisCache("order")]
        public async Task<ActionResult<List<Order>>> GetAllOrdersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20) {
            var orders = await _repo.GetAllOrdersAsync(search,  sortBy,pageNumber = 1, pageSize = 20);
            return Ok(orders);
        }
        [HttpGet("{id:int}")]
        [RedisCache("order")]
        public async Task<ActionResult<Order>> GetOrderById([FromRoute] int id) {
            var order = await _repo.GetOrderByIdAsync(id);
            if (order == null) {
                return NotFound(new { message = $"Orders with id : {id} not found." });
            }

            return Ok(order);
        }
        [HttpDelete("{id:int}")]
        [InvalidateCache("order", "orderitem", "arrangement")]
        public async Task<ActionResult<Order>> DeleteOrderByIdAsync([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"order:{id}"))
            {
                var order = await _repo.DeleteOrderByIdAsync(id);
                if (order == null)
                {
                    return NotFound(new { message = $"Orders with id : {id} not found." });
                }

                return Ok(order);
            }
        }

        [HttpPost]
        [InvalidateCache("order", "orderitem", "arrangement")]
        public async Task<ActionResult<Order>> CreateNewOrderAsync(CreateOrderDTO orderDto) {
            // Lock the customer to prevent concurrent order creation issues
            using (await _lockService.AcquireLockAsync($"customer:{orderDto.CustomerId}"))
            {
                var created = await _repo.CreateNewOrderAsync(orderDto);

                return CreatedAtAction(nameof(GetOrderById), new { id = created!.Id }, created);
            }
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("order", "orderitem", "arrangement")]
        public async Task<ActionResult<Order>> UpdateOrderByIdAsync([FromRoute] int id, UpdateOrderDTO updateDto) {
            using (await _lockService.AcquireLockAsync($"order:{id}"))
            {
                var updated = await _repo.UpdateOrderByIdAsync(id, updateDto);

                return Ok(updated);
            }
        }

        [HttpGet("{id:int}/items")]
        [RedisCache("order")]
        public async Task<ActionResult<List<OrderItem>>> GetItemsByOrderId([FromRoute] int id)
        {
            var items = await _repo.GetItemsByOrderIdAsync(id);
            return Ok(items);
        }

        [HttpGet("customer/{customerId:int}")]
        [RedisCache("order")]
        public async Task<ActionResult<List<Order>>> GetOrderByCustomerId([FromRoute] int customerId, [FromQuery] int? status, [FromQuery] int? year)
        {
            var orders = await _repo.GetOrderByCustomerIdAsync(customerId, status, year);

            if (orders == null) {
                return NotFound(new {message = $"Customer with id : {customerId} not found." });
            }

            return Ok(orders);
        }

    }
}
