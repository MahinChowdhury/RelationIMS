using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers.ProductVariantsControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductVariantsController : ControllerBase
    {
        private readonly IProductVariantRepository _repo;
        private readonly IConcurrencyLockService _lockService;

        public ProductVariantsController(IProductVariantRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        // For Adding Actual Product Variants
        [HttpGet]
        [RedisCache("productvariant")]
        public async Task<ActionResult<List<ProductVariant>>> GetAllProductVariants() {
            var variants = await _repo.GetAllProductVariantsAsync();

            return Ok(variants);
        }
        [HttpGet("{id:int}")]
        [RedisCache("productvariant")]
        public async Task<ActionResult<ProductVariant>> GetProductVariantById([FromRoute] int id) {
            var variant = await _repo.GetProductVariantByIdAsync(id);
            if (variant == null) {
                return NotFound(new { message = $"Product Variant with {id} not found."});
            }
            return Ok(variant);
        }
        [HttpPost]
        [InvalidateCache("productvariant", "productitem", "product")]
        public async Task<ActionResult<ProductVariant>> CreateProductVariantAsync([FromBody] CreateProductVariantDTO variantDTO) {

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock the product to prevent concurrent variant creation
            using (await _lockService.AcquireLockAsync($"product:{variantDTO.ProductId}"))
            {
                var created = await _repo.CreateProductVariantAsync(variantDTO);
                if (created == null) { 
                    return BadRequest();
                }

                return CreatedAtAction(nameof(GetProductVariantById), new { id = created.Id }, created);
            }
        }

        [HttpPut("{id:int}")]
        [InvalidateCache("productvariant", "productitem", "product")]
        public async Task<ActionResult<ProductVariant>> UpdateProductVariantAsync([FromRoute] int id, [FromBody] UpdateProductVariantDTO variantDTO)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            using (await _lockService.AcquireLockAsync($"productvariant:{id}"))
            {
                var updated = await _repo.UpdateProductVariantAsync(id,variantDTO);
                if (updated == null)
                {
                    return BadRequest();
                }

                return Ok(updated);
            }
        }

        [HttpDelete("{id:int}")]
        [InvalidateCache("productvariant", "productitem", "product")]
        public async Task<ActionResult<ProductVariant>> DeleteProductVariantAsync([FromRoute] int id) {
            using (await _lockService.AcquireLockAsync($"productvariant:{id}"))
            {
                var deleted = await _repo.DeleteProductVariantAsync(id);
                if (deleted == null) {
                    return NotFound();
                }

                return Ok(deleted);
            }
        }

        [HttpGet("product/{id:int}")]
        [RedisCache("productvariant")]
        public async Task<ActionResult<List<ProductVariant>>> GetProductVariantsByProductId([FromRoute] int id) {
            var variants = await _repo.GetProductVariantsByProductIdAsync(id);

            return Ok(variants);
        }

        [HttpPost("{id:int}/stock")]
        [InvalidateCache("productvariant", "productitem", "product", "inventory")]
        public async Task<ActionResult<List<ProductItem>>> AddStock([FromRoute] int id, [FromBody] AddStockDTO stockDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock both variant and inventory to prevent concurrent stock additions
            using (await _lockService.AcquireLockAsync($"productvariant:{id}"))
            using (await _lockService.AcquireLockAsync($"inventory:{stockDto.InventoryId}"))
            {
                var items = await _repo.AddStockAsync(id, stockDto.Quantity, stockDto.InventoryId);
                return Ok(items);
            }
        }

        [HttpPost("stock/bulk")]
        [InvalidateCache("productvariant", "productitem", "product", "inventory")]
        public async Task<ActionResult<List<ProductItem>>> AddStockBulk([FromBody] BulkAddStockDTO bulkDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Lock all variants and inventories (sorted to prevent deadlocks)
            var variantIds = bulkDto.Items.Select(i => i.VariantId).Distinct().OrderBy(id => id).ToList();
            var inventoryIds = bulkDto.Items.Select(i => i.InventoryId).Distinct().OrderBy(id => id).ToList();
            
            var lockDisposables = new List<IDisposable>();
            try
            {
                // Acquire all locks in sorted order
                foreach (var variantId in variantIds)
                {
                    lockDisposables.Add(await _lockService.AcquireLockAsync($"productvariant:{variantId}"));
                }
                foreach (var inventoryId in inventoryIds)
                {
                    lockDisposables.Add(await _lockService.AcquireLockAsync($"inventory:{inventoryId}"));
                }

                var items = await _repo.AddStockBulkAsync(bulkDto);
                return Ok(items);
            }
            finally
            {
                // Release all locks in reverse order
                for (int i = lockDisposables.Count - 1; i >= 0; i--)
                {
                    lockDisposables[i].Dispose();
                }
            }
        }


    }
}