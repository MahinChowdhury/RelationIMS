using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers.ProductVariantsControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductVariantSizesController : ControllerBase
    {
        private readonly IProductVariantSizeRepository _repo;
        private readonly IConcurrencyLockService _lockService;

        public ProductVariantSizesController(IProductVariantSizeRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }
        //For Product Size and Color
        [HttpPost]
        [InvalidateCache("productvariantsize", "productvariant")]
        public async Task<IActionResult> AddSizeForProductAsync([FromBody] CreateNewProductSizeDTO productSize)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.AddSizeForProductAsync(productSize);
            if (created == null)
            {
                return BadRequest(ModelState);
            }
            return CreatedAtAction(nameof(GetProductSizeById), new { id = created.Id }, created);
        }
        [HttpGet("{id:int}")]
        [RedisCache("productvariantsize")]
        public async Task<ActionResult<ProductSize>> GetProductSizeById([FromRoute] int id)
        {
            var productSize = await _repo.GetProductSizeByIdAsync(id);
            if (productSize == null)
            {
                return NotFound();
            }

            return Ok(productSize);
        }

        [HttpGet("category/{categoryId}")]
        [RedisCache("productvariantsize")]
        public async Task<ActionResult<List<ProductSize>>> GetAllProductSizeByNameAsync([FromRoute] int categoryId)
        {
            var sizes = await _repo.GetAllProductSizeByCategoryIdAsync(categoryId);

            return Ok(sizes);
        }

        [HttpDelete("{id:int}")]
        [InvalidateCache("productvariantsize", "productvariant")]
        public async Task<ActionResult<ProductSize?>> DeleteProductSizeByIdAsync([FromRoute] int id) {
            using (await _lockService.AcquireLockAsync($"size:{id}"))
            {
                var deleted = await _repo.DeleteProductSizeByIdAsync(id);

                if (deleted == null) {
                    return NotFound(ModelState);
                }
                return Ok(deleted);
            }
        }

        [HttpGet]
        [RedisCache("productvariantsize")]
        public async Task<ActionResult<List<ProductSize>>> GetAllSizesAsync()
        {
            var sizes = await _repo.GetAllSizesAsync();
            if (sizes == null) return NotFound();
            return Ok(sizes);
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("productvariantsize", "productvariant")]
        public async Task<ActionResult<ProductSize>> UpdateProductSize([FromRoute] int id, [FromBody] CreateNewProductSizeDTO sizeDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"size:{id}"))
            {
                var updated = await _repo.UpdateSizeForProductAsync(id, sizeDTO);

                if (updated == null)
                {
                    return NotFound();
                }

                return Ok(updated);
            }
        }
    }
}
