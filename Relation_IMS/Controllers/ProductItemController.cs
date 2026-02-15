using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ProductItemController : ControllerBase
    {
        private readonly IProductItemRepository _repo;
        private readonly IConcurrencyLockService _lockService;

        public ProductItemController(IProductItemRepository repo, IConcurrencyLockService lockService)
        {
            _repo = repo;
            _lockService = lockService;
        }

        [HttpGet]
        public async Task<ActionResult<List<ProductItem>>> GetAllProductItems()
        {
            var items = await _repo.GetAllProductItemsAsync();
            return Ok(items);
        }

        [HttpGet("defects")]
        public async Task<ActionResult<List<DefectItemResDTO>>> GetAllDefectedProductItems()
        {
            var items = await _repo.GetAllDefectedProductItemsAsync();
            return Ok(items);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ProductItem?>> GetProductItemById([FromRoute] int id)
        {
            var item = await _repo.GetProductItemByIdAsync(id);
            if (item == null) return NotFound(new { message = $"ProductItem with id {id} not found." });

            return item;
        }

        [HttpGet("code/{code}")]
        public async Task<ActionResult<ProductItemResponseDTO?>> GetProductItemByCode([FromRoute] string code)
        {
            var item = await _repo.GetProductItemByCodeAsync(code);
            if (item == null) return NotFound(new { message = $"ProductItem with code {code} not found." });

            return item;
        }

        [HttpPost]
        public async Task<ActionResult<ProductItem>> CreateNewProductItem(CreateProductItemDTO itemDto)
        {
            var created = await _repo.CreateProductItemAsync(itemDto);

            return CreatedAtAction(nameof(GetProductItemById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ProductItem?>> UpdateProductItem([FromRoute] int id, CreateProductItemDTO itemDto)
        {
            using (await _lockService.AcquireLockAsync($"productitem:{id}"))
            {
                var updated = await _repo.UpdateProductItemAsync(id, itemDto);
                if (updated == null) return NotFound(new { message = $"ProductItem with id {id} not found." });

                return Ok(updated);
            }
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<ProductItem?>> DeleteProductItem([FromRoute] int id)
        {
            using (await _lockService.AcquireLockAsync($"productitem:{id}"))
            {
                var deleted = await _repo.DeleteProductItemAsync(id);
                if (deleted == null) return NotFound(new { message = $"ProductItem with id {id} not found." });

                return Ok(deleted);
            }
        }

        //[HttpPost("{id:int}/defect")]
        //public async Task<ActionResult<ProductItem?>> DefectProductItemById([FromRoute] int id) {
        //    var defect = await _repo.DefectProductItemByIdAsync(id);
        //    if (defect == null) return NotFound(new { message = $"productItem not found with id : {id}"});

        //    return Ok(defect);
        //}

        [HttpPost("{code}/defect")]
        public async Task<ActionResult<DefectItemResDTO?>> DefectProductItemByCode([FromRoute] string code, [FromBody] DefectRequestDTO defectDto)
        {
            // Extract user ID from claims
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("id");
            int? userId = null;
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int parsedId))
            {
                userId = parsedId;
            }
            
            using (await _lockService.AcquireLockAsync($"productitem:{code}"))
            {
                var defect = await _repo.DefectProductItemByCodeAsync(code, defectDto, userId);
                if (defect == null) return NotFound(new { message = $"productItem not found with code : {code}" });

                return Ok(defect);
            }
        }
    }
}
