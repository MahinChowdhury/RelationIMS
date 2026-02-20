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
    public class ProductVariantColorsController : ControllerBase
    {
        private readonly IProductVariantColorRepository _repo;
        private readonly IConcurrencyLockService _lockService;

        public ProductVariantColorsController(IProductVariantColorRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpPost]
        [InvalidateCache("productvariantcolor", "productvariant")]
        public async Task<IActionResult> AddColorForProductAsync([FromBody] CreateNewProductColorDTO productColor)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.AddColorForProductAsync(productColor);
            if (created == null)
            {
                return BadRequest(ModelState);
            }
            return CreatedAtAction(nameof(GetProductColorById), new { id = created.Id }, created);
        }
        [HttpGet("{id:int}")]
        [RedisCache("productvariantcolor")]
        public async Task<ActionResult<ProductColor>> GetProductColorById([FromRoute] int id)
        {
            var productColor = await _repo.GetProductColorByIdAsync(id);
            if (productColor == null)
            {
                return NotFound();
            }

            return Ok(productColor);
        }

        [HttpGet]
        [RedisCache("productvariantcolor")]
        public async Task<ActionResult<List<ProductSize>>> GetAllProductColorAsync()
        {
            var colors = await _repo.GetAllProductColorAsync();

            return Ok(colors);
        }
        [HttpDelete("{id:int}")]
        [InvalidateCache("productvariantcolor", "productvariant")]
        public async Task<ActionResult<ProductColor?>> DeleteProductColorById([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"color:{id}"))
            {
                var deleted = await _repo.DeleteProductColorByIdAsync(id);

                if (deleted == null) {
                    return NotFound(ModelState);
                }

                return Ok(deleted);
            }
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("productvariantcolor", "productvariant")]
        public async Task<ActionResult<ProductColor>> UpdateProductColor([FromRoute] int id, [FromBody] CreateNewProductColorDTO colorDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"color:{id}"))
            {
                var updated = await _repo.UpdateColorForProductAsync(id, colorDTO);

                if (updated == null)
                {
                    return NotFound();
                }

                return Ok(updated);
            }
        }
    }
}
