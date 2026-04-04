using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;
using Finbuckle.MultiTenant;

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
        [RedisCache("product")]
        public async Task<ActionResult<List<Product>>> GetAllProductsAsync(
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] string? stockOrder, 
            [FromQuery(Name="BrandId")] int brandId = -1, 
            [FromQuery(Name="categoryId")] int categoryId = -1,
            [FromQuery(Name="QuarterId")] int quarterId = -1,
            [FromQuery] int pageNumber = 1, 
            [FromQuery] int pageSize = 20) {
            var products = await _repo.GetAllProductsAsync(search,sortBy, stockOrder, brandId, categoryId, quarterId, pageNumber, pageSize);

            bool isOwner = User.IsInRole("Owner");
            if (!isOwner)
            {
                var shopClaim = User.Claims.FirstOrDefault(c => c.Type == "ShopNo")?.Value;
                if (shopClaim == "0") isOwner = true;
            }

            if (!isOwner)
            {
                foreach (var p in products)
                {
                    p.CostPrice = 0;
                }
            }

            return Ok(products);
        }

        [HttpGet("{id:int}")]
        [RedisCache("product")]
        public async Task<ActionResult<Product>> GetProductById([FromRoute] int id) {
            var product = await _repo.GetProductByIdAsync(id);
            if (product == null) {
                return NotFound(new {message = $"Product with ID {id} not found." });
            }

            bool isOwner = User.IsInRole("Owner");
            if (!isOwner)
            {
                var shopClaim = User.Claims.FirstOrDefault(c => c.Type == "ShopNo")?.Value;
                if (shopClaim == "0") isOwner = true;
            }

            if (!isOwner)
            {
                product.CostPrice = 0;
            }

            return Ok(product);
        }

        [HttpDelete("{id:int}")]
        [InvalidateCache("product", "productvariant", "productitem")]
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
        [InvalidateCache("product", "productvariant", "productitem")]
        public async Task<IActionResult> CreateProductAsync([FromForm] CreateProductFormDTO productFormDto, [FromServices] System.Threading.Channels.Channel<Relation_IMS.Services.ProductImageUploadTask> channel)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock the category to prevent concurrent product code generation
            using (await _lockService.AcquireLockAsync($"category:{productFormDto.CategoryId}"))
            {
                var productDto = new CreateNewProductDTO
                {
                    Name = productFormDto.Name,
                    Description = productFormDto.Description,
                    BasePrice = productFormDto.BasePrice,
                    CostPrice = productFormDto.CostPrice,
                    MSRP = productFormDto.MSRP,
                    BrandId = productFormDto.BrandId,
                    QuarterIds = productFormDto.QuarterIds ?? new List<int>(),
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
                        var tenantInfo = HttpContext.GetMultiTenantContext<AppTenantInfo>()?.TenantInfo;
                        var tenantId = tenantInfo?.Identifier ?? "RelationIms";
                        await channel.Writer.WriteAsync(new Relation_IMS.Services.ProductImageUploadTask(created.Id, imagesToUpload, tenantId));
                    }
                }

                return CreatedAtAction(nameof(GetProductById), new { id = created.Id }, created);
            }
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("product", "productvariant", "productitem")]
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