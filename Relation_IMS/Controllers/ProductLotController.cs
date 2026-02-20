using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Entities;
using Relation_IMS.Dtos.ProductModels;
using Relation_IMS.Filters;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Models.InventoryModels;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductLotController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ProductCodeGenerator _codeGenerator;
        private readonly IConcurrencyLockService _lockService;

        public ProductLotController(ApplicationDbContext context, ProductCodeGenerator codeGenerator, IConcurrencyLockService lockService)
        {
            _context = context;
            _codeGenerator = codeGenerator;
            _lockService = lockService;
        }

        [HttpPost]
        [InvalidateCache("product", "productvariant", "productitem", "inventory")]
        public async Task<IActionResult> CreateProductLot([FromForm] CreateProductLotDto lotDto, [FromServices] System.Threading.Channels.Channel<Relation_IMS.Services.ProductImageUploadTask> channel)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock the category to prevent concurrent code generation issues
            using (await _lockService.AcquireLockAsync($"category:{lotDto.CategoryId}"))
            {
                using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Create Product
                var product = new Product
                {
                    Name = lotDto.Name,
                    Description = lotDto.Description,
                    BasePrice = lotDto.BasePrice,
                    CostPrice = lotDto.CostPrice,
                    MSRP = lotDto.MSRP,
                    BrandId = lotDto.BrandId,
                    CategoryId = lotDto.CategoryId,
                    ImageUrls = new List<string>(), // Will be filled by background worker
                    TotalQuantity = lotDto.LotQuantity * lotDto.Variants.Count 
                    // Code will be generated after save to get Id
                };

                _context.Products.Add(product);
                await _context.SaveChangesAsync();
                
                // Get category and generate product code
                var category = await _context.Categories.FindAsync(product.CategoryId);
                if (category == null)
                    return BadRequest(new { Message = "Category not found" });
                
                // Ensure category has a code
                if (string.IsNullOrEmpty(category.Code))
                {
                    category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
                }
                
                // Generate product code: {CategoryFirstLetter}{ProductId:D4}
                product.Code = _codeGenerator.GenerateProductCode(category.Code, product.Id);

                // 2. Create ProductLot
                // Lot Code: L-{YYMMDD}-{ProductID}-{LotID} (need LotId first)
                var lot = new ProductLot
                {
                    ProductId = product.Id,
                    LotQuantity = lotDto.LotQuantity,
                    Description = $"Lot for {product.Name}",
                    CreatedDate = DateTime.UtcNow
                };
                _context.Set<ProductLot>().Add(lot);
                await _context.SaveChangesAsync();

                // Generate lot code: {LotId:D4}
                lot.Code = _codeGenerator.GenerateLotCode(lot.Id);


                // 3. Create Variants and Items
                // We need default inventory from somewhere. ProductController used hardcoded InventoryId = 1 in StockIn.tsx examples?
                // StockIn.tsx logic: "DefaultInventoryId: 1". I will use 1 for now.
                int defaultInventoryId = 1;

                foreach (var vDto in lotDto.Variants)
                {
                    var variant = new ProductVariant
                    {
                        ProductId = product.Id,
                        ProductColorId = vDto.ColorId,
                        ProductSizeId = vDto.SizeId,
                        ProductItems = new List<ProductItem>(),
                        VariantPrice = product.BasePrice
                    };

                    _context.ProductVariants.Add(variant);
                    await _context.SaveChangesAsync(); // Need ID

                    // Generate Items with new hierarchical code format
                    // Format: {ProductCode}-{LotCode}-{VariantId:D3}-{SeqNumber:D4}
                    for (int i = 0; i < lotDto.LotQuantity; i++)
                    {
                        var itemCode = _codeGenerator.GenerateProductItemCode(
                            product.Code!, 
                            variant.Id, 
                            i);
                        
                        var item = new ProductItem
                        {
                            ProductVariantId = variant.Id,
                            ProductLotId = lot.Id,
                            Code = itemCode,
                            IsDefected = false,
                            IsSold = false,
                            InventoryId = defaultInventoryId
                        };
                         _context.ProductItems.Add(item);
                    }
                }
                
                await _context.SaveChangesAsync();

                // 4. Handle Images (Copying logic from ProductController)
                if (lotDto.Images != null && lotDto.Images.Count > 0)
                {
                    var imagesToUpload = new List<(string FileName, Stream Content)>();

                    foreach (var file in lotDto.Images)
                    {
                        if (file.Length > 0)
                        {
                            var memoryStream = new MemoryStream();
                            await file.CopyToAsync(memoryStream);
                            memoryStream.Position = 0;
                            
                             var fileNameWithoutExt = Path.GetFileNameWithoutExtension(file.FileName);
                             var fileName = $"{Guid.NewGuid()}_{fileNameWithoutExt}.webp"; 

                            imagesToUpload.Add((fileName, memoryStream));
                        }
                    }

                    if (imagesToUpload.Count > 0)
                    {
                        await channel.Writer.WriteAsync(new Relation_IMS.Services.ProductImageUploadTask(product.Id, imagesToUpload));
                    }
                }

                await transaction.CommitAsync();

                return Ok(new { Message = "Lot created successfully", ProductId = product.Id, LotId = lot.Id, ProductCode = product.Code, LotCode = lot.Code });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { Message = "An error occurred while creating the lot.", Error = ex.Message });
            }
            }
        }

        [HttpPost("existing")]
        [InvalidateCache("product", "productvariant", "productitem", "inventory")]
        public async Task<IActionResult> CreateLotForExistingProduct([FromBody] CreateExistingProductLotDto lotDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"product:{lotDto.ProductId}"))
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    var product = await _context.Products.FindAsync(lotDto.ProductId);
                    if (product == null) return NotFound("Product not found");

                    // Ensure Product has a code (migration support)
                    if (string.IsNullOrEmpty(product.Code))
                    {
                        var category = await _context.Categories.FindAsync(product.CategoryId);
                        if (category == null)
                            return BadRequest(new { Message = "Category not found" });
                        
                        if (string.IsNullOrEmpty(category.Code))
                        {
                            category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
                        }
                        
                        product.Code = _codeGenerator.GenerateProductCode(category.Code, product.Id);
                    }

                    var lot = new ProductLot
                    {
                        ProductId = product.Id,
                        LotQuantity = lotDto.LotQuantity,
                        Description = lotDto.Description ?? $"Partial Lot for {product.Name}",
                        CreatedDate = DateTime.UtcNow
                    };

                    _context.Set<ProductLot>().Add(lot);
                    await _context.SaveChangesAsync();

                    // Generate lot code: {LotId:D4}
                    lot.Code = _codeGenerator.GenerateLotCode(lot.Id);
                    
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok(new { LotId = lot.Id, LotCode = lot.Code });
                }
                 catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, new { Message = "An error occurred.", Error = ex.Message });
                }
            }
        }
    }
}
