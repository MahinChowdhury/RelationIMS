using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Validations;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRepository _repo;
        private readonly IConcurrencyLockService _lockService;
        public CustomerController(ICustomerRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpGet]
        [RedisCache("customer")]
        public async Task<ActionResult<List<Customer>>> GetAllCustomersAsync(string? search, string? sortBy, int pageNumber = 1, int pageSize = 20) {
            var customers = await _repo.GetAllCustomersAsync(search, sortBy, pageNumber, pageSize);

            return Ok(customers);
        }
        [HttpGet("{id:int}")]
        [RedisCache("customer")]
        public async Task<ActionResult<Customer?>> GetCustomerById([FromRoute] int id)
        {
            var customer = await _repo.GetCustomerByIdAsync(id);
            if (customer == null) {
                return NotFound(new { message = $"Customer with id : {id} not found."});
            }
            return Ok(customer);
        }
        [HttpDelete("{id:int}")]
        [InvalidateCache("customer", "order", "arrangement")]
        public async Task<ActionResult<Customer?>> DeleteCustomerByIdAsync([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"customer:{id}"))
            {
                var customer = await _repo.DeleteCustomerByIdAsync(id);
                if (customer == null)
                {
                    return NotFound(new { message = $"Customer with id : {id} not found." });
                }
                return Ok(customer);
            }
        }

        [HttpPost]
        [InvalidateCache("customer")]
        public async Task<ActionResult<Customer>> CreateNewCustomerAsync(CreateCustomerDTO customerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.CreateNewCustomerAsync(customerDto);

            if (created == null)
                return Conflict(new { message = $"Category '{customerDto.Name}' already exists." });

            return CreatedAtAction(nameof(GetCustomerById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("customer", "order", "arrangement")]
        public async Task<ActionResult<Customer>> UpdateCustomerAsync(int id,UpdateCustomerDTO updateDto) {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            
            using (await _lockService.AcquireLockAsync($"customer:{id}"))
            {
                var updated = await _repo.UpdateCustomerByIdAsync(id,updateDto);

                return Ok(updated);
            }
        }

    }
}
