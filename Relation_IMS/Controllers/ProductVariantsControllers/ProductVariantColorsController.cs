using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Controllers.ProductVariantsControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductVariantColorsController : ControllerBase
    {
        private readonly IProductVariantColorRepository _repo;
        public ProductVariantColorsController(IProductVariantColorRepository repo)
        {
            _repo = repo;
        }

        [HttpPost]
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
        public async Task<ActionResult<List<ProductSize>>> GetAllProductColorAsync()
        {
            var colors = await _repo.GetAllProductColorAsync();

            return Ok(colors);
        }
        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ProductColor?>> DeleteProductColorById([FromRoute] int id)
        {
            var deleted = await _repo.DeleteProductColorByIdAsync(id);

            if (deleted == null) {
                return NotFound(ModelState);
            }

            return Ok(deleted);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ProductColor>> UpdateProductColor([FromRoute] int id, [FromBody] CreateNewProductColorDTO colorDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _repo.UpdateColorForProductAsync(id, colorDTO);

            if (updated == null)
            {
                return NotFound();
            }

            return Ok(updated);
        }
    }
}
