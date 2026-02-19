using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class BrandController : ControllerBase
    {
        private readonly IBrandRepository _repo;
        private readonly IConcurrencyLockService _lockService;
        public BrandController(IBrandRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Brand>>> GetAllBrandsAsync() {
            var brands = await _repo.GetAllBrandsAsync();

            return Ok(brands);
        }
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Brand?>> GetBrandById([FromRoute] int id) {
            var brand = await _repo.GetBrandByIdAsync(id);

            if (brand == null) {
                return NotFound(new { Message = $"Brand with Id : {id} not found" });
            }

            return Ok(brand);        
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Brand?>> DeleteBrandByIdAsync([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"brand:{id}"))
            {
                var brand = await _repo.DeleteBrandByIdAsync(id);

                if (brand == null)
                {
                    return NotFound(new { Message = $"Brand with Id : {id} not found" });
                }

                return Ok(brand);
            }
        }

        [HttpPost]
        public async Task<ActionResult<Brand>> CreateBrandAsync(CreateBrandDTO brandDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.CreateBrandAsync(brandDTO);

            return CreatedAtAction(nameof(GetBrandById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<Brand>> UpdateBrand([FromRoute] int id, [FromBody] CreateBrandDTO brandDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"brand:{id}"))
            {
                var updated = await _repo.UpdateBrandAsync(id, brandDTO);

                if (updated == null)
                {
                    return NotFound(new { Message = $"Brand with Id : {id} not found" });
                }

                return Ok(updated);
            }
        }

        [HttpGet("category/{categoryId:int}")]
        public async Task<ActionResult<List<Brand>>> GetBrandsByCategory([FromRoute] int categoryId)
        {
            var brands = await _repo.GetBrandsByCategoryIdAsync(categoryId);
            return Ok(brands);
        }

    }
}
