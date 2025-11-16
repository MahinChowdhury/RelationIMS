using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Controllers.ProductVariantsControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductVariantsController : ControllerBase
    {
        private readonly IProductVariantRepository _repo;
        public ProductVariantsController(IProductVariantRepository repo)
        {
            _repo = repo;
        }

        // For Adding Actual Product Variants
        [HttpGet]
        public async Task<ActionResult<List<ProductVariant>>> GetAllProductVariants() {
            var variants = await _repo.GetAllProductVariantsAsync();

            return Ok(variants);
        }
        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProductVariant>> GetProductVariantById([FromRoute] int id) {
            var variant = await _repo.GetProductVariantByIdAsync(id);
            if (variant == null) {
                return NotFound(new { message = $"Product Variant with {id} not found."});
            }
            return Ok(variant);
        }
        [HttpPost]
        public async Task<ActionResult<ProductVariant>> CreateProductVariantAsync([FromBody] CreateProductVariantDTO variantDTO) {

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.CreateProductVariantAsync(variantDTO);
            if (created == null) { 
                return BadRequest();
            }

            return CreatedAtAction(nameof(GetProductVariantById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ProductVariant>> UpdateProductVariantAsync([FromRoute] int id, [FromBody] UpdateProductVariantDTO variantDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _repo.UpdateProductVariantAsync(id,variantDTO);
            if (updated == null)
            {
                return BadRequest();
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ProductVariant>> DeleteProductVariantAsync([FromRoute] int id) {
            var deleted = await _repo.DeleteProductVariantAsync(id);
            if (deleted == null) {
                return NotFound();
            }

            return Ok(deleted);
        }

        [HttpGet("product/{id:int}")]
        public async Task<ActionResult<List<ProductVariant>>> GetProductVariantsByProductId([FromRoute] int id) {
            var variants = await _repo.GetProductVariantsByProductIdAsync(id);

            return Ok(variants);
        }


    }
}