using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly IProductRepository _repo;
        private readonly IConcurrencyLockService _lockService;
        public ProductController(IProductRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
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
            using (await _lockService.AcquireLockAsync($"product:{id}"))
            {
                var product = await _repo.DeleteProductByIdAsync(id);
                if (product == null) {
                    return NotFound();
                }
    
                return Ok(product);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateProductAsync([FromForm] CreateProductFormDTO productFormDto, [FromServices] System.Threading.Channels.Channel<Relation_IMS.Services.ProductImageUploadTask> channel)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var productDto = new CreateNewProductDTO
            {
                Name = productFormDto.Name,
                Description = productFormDto.Description,
                BasePrice = productFormDto.BasePrice,
                CostPrice = productFormDto.CostPrice,
                MSRP = productFormDto.MSRP,
                BrandId = productFormDto.BrandId,
                CategoryId = productFormDto.CategoryId,
                ImageUrls = new List<string>() // Initially empty, will be updated by background job
            };

            var created = await _repo.CreateProductAsync(productDto);

            if (created == null)
            {
                return BadRequest(new { Message = "Product couldn't be created." });
            }

            // Queue images for background upload
            if (productFormDto.Images != null && productFormDto.Images.Count > 0)
            {
                var imagesToUpload = new List<(string FileName, Stream Content)>();

                foreach (var file in productFormDto.Images)
                {
                    if (file.Length > 0)
                    {
                        var memoryStream = new MemoryStream();
                        await file.CopyToAsync(memoryStream);
                        memoryStream.Position = 0;
                        
                        // Generate a unique filename here or let service handle uniqueness?
                        // Service uses Path.GetFileNameWithoutExtension(file.FileName) then adds .webp
                        // To avoid collisions we should probably randomize or append ID, but sticking to existing logic for now.
                        // Existing logic: var fileNameWithoutExt = Path.GetFileNameWithoutExtension(file.FileName);
                        
                        // We will pass the original filename so service can process it similarly
                         var fileNameWithoutExt = Path.GetFileNameWithoutExtension(file.FileName);
                         var fileName = $"{Guid.NewGuid()}_{fileNameWithoutExt}.webp"; // Enhanced uniqueness

                        imagesToUpload.Add((fileName, memoryStream));
                    }
                }

                if (imagesToUpload.Count > 0)
                {
                    await channel.Writer.WriteAsync(new Relation_IMS.Services.ProductImageUploadTask(created.Id, imagesToUpload));
                }
            }

            return CreatedAtAction(nameof(GetProductById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateProductByIdAsync([FromRoute] int id, [FromBody] UpdateProductDTO updateDto) {

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"product:{id}"))
            {
                var product = await _repo.UpdateProductByIdAsync(id,updateDto);
                return Ok(product);
            }
        }
    }
}