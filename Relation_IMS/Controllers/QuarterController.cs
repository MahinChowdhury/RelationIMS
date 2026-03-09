using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class QuarterController : ControllerBase
    {
        private readonly IQuarterRepository _repo;

        public QuarterController(IQuarterRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        [RedisCache("quarter")]
        public async Task<ActionResult<List<Quarter>>> GetAllQuarters()
        {
            var quarters = await _repo.GetAllQuartersAsync();
            return Ok(quarters);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Quarter>> GetQuarterById([FromRoute] int id)
        {
            var quarter = await _repo.GetQuarterByIdAsync(id);
            if (quarter == null)
            {
                return NotFound(new { message = $"Quarter with ID {id} not found." });
            }

            return Ok(quarter);
        }

        [HttpPost]
        public async Task<IActionResult> CreateQuarter([FromBody] CreateQuarterDTO createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _repo.CreateQuarterAsync(createDto);
            return CreatedAtAction(nameof(GetQuarterById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateQuarter([FromRoute] int id, [FromBody] UpdateQuarterDTO updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _repo.UpdateQuarterByIdAsync(id, updateDto);
            if (updated == null)
            {
                return NotFound(new { message = $"Quarter with ID {id} not found." });
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteQuarter([FromRoute] int id)
        {
            var deleted = await _repo.DeleteQuarterByIdAsync(id);
            if (deleted == null)
            {
                return NotFound(new { message = $"Quarter with ID {id} not found." });
            }

            return Ok(deleted);
        }
    }
}
