using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Validations;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos.CustomerDtos;
using Relation_IMS.Models.CustomerModels;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRepository _repo;
        public CustomerController(ICustomerRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<ActionResult<List<Customer>>> GetAllCustomersAsync() {
            var customers = await _repo.GetAllCustomersAsync();

            return Ok(customers);
        }
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Customer?>> GetCustomerById([FromRoute] int id)
        {
            var customer = await _repo.GetCustomerByIdAsync(id);
            if (customer == null) {
                return NotFound(new { message = $"Customer with id : {id} not found."});
            }
            return Ok(customer);
        }
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Customer?>> DeleteCustomerByIdAsync([FromRoute] int id)
        {
            var customer = await _repo.DeleteCustomerByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = $"Customer with id : {id} not found." });
            }
            return Ok(customer);
        }

        [HttpPost]
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
        public async Task<ActionResult<Customer>> UpdateCustomerAsync(int id,UpdateCustomerDTO updateDto) {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
            var updated = await _repo.UpdateCustomerByIdAsync(id,updateDto);

            return Ok(updated);
        }

    }
}
