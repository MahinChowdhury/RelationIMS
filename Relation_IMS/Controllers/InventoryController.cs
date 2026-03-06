using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Filters;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{

    [ApiController]
    [Route("api/v1/[controller]")]
    
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryRepository _inventoryRepo;
        private readonly IConcurrencyLockService _lockService;

        public InventoryController(IInventoryRepository inventoryRepo, IConcurrencyLockService lockService)
        {
            _inventoryRepo = inventoryRepo;
            _lockService = lockService;
        }

        // GET: api/Inventory
        [HttpGet]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetAllInventories()
        {
            var inventories = await _inventoryRepo.GetAllInventoriesAsync();
            return Ok(inventories);
        }

        // GET: api/Inventory/5
        [HttpGet("{id}")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetInventoryById(int id)
        {
            var inventory = await _inventoryRepo.GetInventoryByIdAsync(id);
            if (inventory == null)
            {
                return NotFound(new { message = $"Inventory with ID {id} not found." });
            }
            return Ok(inventory);
        }

        // GET: api/Inventory/5/items - Get all items in inventory with details
        [HttpGet("{id}/items")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetInventoryItems(int id)
        {
            var items = await _inventoryRepo.GetInventoryProductItemsAsync(id);
            return Ok(items);
        }

        // POST: api/Inventory
        [HttpPost]
        [InvalidateCache("inventory")]
        public async Task<IActionResult> CreateInventory([FromBody] CreateInventoryDTO inventoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var inventory = await _inventoryRepo.CreateNewInventoryAsync(inventoryDto);
            return CreatedAtAction(nameof(GetInventoryById), new { id = inventory.Id }, inventory);
        }

        // PUT: api/Inventory/5
        [HttpPut("{id}")]
        [InvalidateCache("inventory")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] CreateInventoryDTO inventoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            using (await _lockService.AcquireLockAsync($"inventory:{id}"))
            {
                var inventory = await _inventoryRepo.UpdateInventoryByIdAsync(id, inventoryDto);
                if (inventory == null)
                {
                    return NotFound(new { message = $"Inventory with ID {id} not found." });
                }
                return Ok(inventory);
            }
        }

        // DELETE: api/Inventory/5
        [HttpDelete("{id}")]
        [InvalidateCache("inventory")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            using (await _lockService.AcquireLockAsync($"inventory:{id}"))
            {
                var inventory = await _inventoryRepo.DeleteInventoryByIdAsync(id);
                if (inventory == null)
                {
                    return NotFound(new { message = $"Inventory with ID {id} not found." });
                }
                return Ok(new { message = "Inventory deleted successfully.", inventory });
            }
        }

        // POST: api/Inventory/transfer
        [HttpPost("transfer")]
        [InvalidateCache("inventory", "productitem", "product", "productvariant")]
        public async Task<IActionResult> TransferProductItem([FromBody] TransferProductItemsDTO transferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Deadlock prevention: Lock lower ID first
            var firstLockKey = transferDto.SourceInventoryId < transferDto.DestinationInventoryId 
                ? $"inventory:{transferDto.SourceInventoryId}" 
                : $"inventory:{transferDto.DestinationInventoryId}";
            
            var secondLockKey = transferDto.SourceInventoryId < transferDto.DestinationInventoryId 
                ? $"inventory:{transferDto.DestinationInventoryId}" 
                : $"inventory:{transferDto.SourceInventoryId}";

            // Acquire locks
            using (await _lockService.AcquireLockAsync(firstLockKey))
            using (await _lockService.AcquireLockAsync(secondLockKey))
            {
                var result = await _inventoryRepo.TransferProductItemsByCodesAsync(
                    transferDto.ProductItemCode,
                    transferDto.SourceInventoryId,
                    transferDto.DestinationInventoryId,
                    transferDto.UserId
                );

                if (!result.Success)
                {
                    return BadRequest(new
                    {
                        message = result.Message
                    });
                }

                return Ok(new
                {
                    message = result.Message,
                    transferredCount = result.TransferredCount,
                    details = result.TransferDetails
                });
            }
        }

        // GET: api/Inventory/5/stock-summary
        [HttpGet("{id}/stock-summary")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetInventoryStockSummary(int id)
        {
            var stockSummary = await _inventoryRepo.GetInventoryStockSummaryAsync(id);
            return Ok(stockSummary);
        }

        // GET: api/Inventory/product/5/stock - Get product stock across all inventories
        [HttpGet("product/{productId}/stock")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetProductStockAcrossInventories(int productId)
        {
            var stockSummary = await _inventoryRepo.GetProductStockAcrossInventoriesAsync(productId);
            return Ok(stockSummary);
        }

        // GET: api/Inventory/variant/5/stock - Get variant stock across all inventories
        [HttpGet("variant/{variantId}/stock")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetVariantStockAcrossInventories(int variantId)
        {
            var stockSummary = await _inventoryRepo.GetVariantStockAcrossInventoriesAsync(variantId);
            return Ok(stockSummary);
        }

        // GET: api/Inventory/transfer/history
        [HttpGet("transfer/history")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetInventoryMovementHistory(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] DateTime? date = null,
            [FromQuery] int? sourceId = null,
            [FromQuery] int? destinationId = null,
            [FromQuery] int? userId = null)
        {
            var records = await _inventoryRepo.GetInventoryTransferRecordsAsync(pageNumber, pageSize, search, date, sourceId, destinationId, userId);
            return Ok(records);
        }

        // POST: api/Inventory/customer-return
        [HttpPost("customer-return")]
        [InvalidateCache("inventory", "productitem", "product", "productvariant")]
        public async Task<IActionResult> ProcessCustomerReturn([FromBody] CustomerReturnRequestDTO returnDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            using (await _lockService.AcquireLockAsync($"inventory:{returnDto.TargetInventoryId}"))
            {
                var result = await _inventoryRepo.ProcessCustomerReturnAsync(returnDto);
                
                if (!result.Success)
                {
                    return BadRequest(new { message = result.Message, invalidCodes = result.InvalidCodes });
                }

                return Ok(new { message = result.Message });
            }
        }

        // GET: api/Inventory/customer-return/history
        [HttpGet("customer-return/history")]
        [RedisCache("inventory")]
        public async Task<IActionResult> GetCustomerReturnHistory([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var history = await _inventoryRepo.GetCustomerReturnRecordsAsync(pageNumber, pageSize);
            return Ok(history);
        }
    }
}