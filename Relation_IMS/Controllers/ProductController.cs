using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository _repo;
        public ProductController(IProductRepository repo)
        {
            _repo = repo;
        }

        [HttpGet]
        public async Task<ActionResult<List<Product>>> GetAllProductsAsync(string? search,string? sortBy,string? stockOrder, int brandId = -1, int categoryId = -1 ,int pageNumber = 1, int pageSize = 20) {
            var products = await _repo.GetAllProductsAsync(search,sortBy, stockOrder, brandId, categoryId, pageNumber, pageSize);

            return Ok(products);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<Product>> GetProductById([FromRoute] int id) {
            var product = await _repo.GetProductByIdAsync(id);
            if (product == null) {
                return NotFound(new {message = $"Product with ID {id} not found." });
            }

            return Ok(product);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProductByIdAsync([FromRoute] int id) {
            var product = await _repo.DeleteProductByIdAsync(id);
            if (product == null) {
                return NotFound();
            }

            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProductAsync([FromBody] CreateNewProductDTO productDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _repo.CreateProductAsync(productDto);

            if (created == null)
            {
                return BadRequest(new {Message = "Product couldn't be created."});
            }

            return CreatedAtAction(nameof(GetProductById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProductByIdAsync([FromRoute] int id, [FromBody] UpdateProductDTO updateDto) {

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var product = await _repo.UpdateProductByIdAsync(id,updateDto);
            return Ok(product);
        }
    }
}