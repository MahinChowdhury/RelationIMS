using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;

namespace Relation_IMS.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryRepository _inventoryRepo;

        public InventoryController(IInventoryRepository inventoryRepo)
        {
            _inventoryRepo = inventoryRepo;
        }

        // GET: api/Inventory
        [HttpGet]
        public async Task<IActionResult> GetAllInventories()
        {
            var inventories = await _inventoryRepo.GetAllInventoriesAsync();
            return Ok(inventories);
        }

        // GET: api/Inventory/5
        [HttpGet("{id}")]
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
        public async Task<IActionResult> GetInventoryItems(int id)
        {
            var items = await _inventoryRepo.GetInventoryProductItemsAsync(id);
            return Ok(items);
        }

        // POST: api/Inventory
        [HttpPost]
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
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] CreateInventoryDTO inventoryDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var inventory = await _inventoryRepo.UpdateInventoryByIdAsync(id, inventoryDto);
            if (inventory == null)
            {
                return NotFound(new { message = $"Inventory with ID {id} not found." });
            }
            return Ok(inventory);
        }

        // DELETE: api/Inventory/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var inventory = await _inventoryRepo.DeleteInventoryByIdAsync(id);
            if (inventory == null)
            {
                return NotFound(new { message = $"Inventory with ID {id} not found." });
            }
            return Ok(new { message = "Inventory deleted successfully.", inventory });
        }

        // POST: api/Inventory/transfer
        [HttpPost("transfer")]
        public async Task<IActionResult> TransferProductItems([FromBody] TransferProductItemsDTO transferDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var success = await _inventoryRepo.TransferProductItemsAsync(
                transferDto.SourceInventoryId,
                transferDto.DestinationInventoryId,
                transferDto.ProductVariantId,
                transferDto.Quantity
            );

            if (!success)
            {
                return BadRequest(new { message = "Transfer failed. Check if source has enough items and destination exists." });
            }

            return Ok(new { message = $"Successfully transferred {transferDto.Quantity} items." });
        }

        // GET: api/Inventory/5/stock-summary
        [HttpGet("{id}/stock-summary")]
        public async Task<IActionResult> GetInventoryStockSummary(int id)
        {
            var stockSummary = await _inventoryRepo.GetInventoryStockSummaryAsync(id);
            return Ok(stockSummary);
        }

        // GET: api/Inventory/product/5/stock - Get product stock across all inventories
        [HttpGet("product/{productId}/stock")]
        public async Task<IActionResult> GetProductStockAcrossInventories(int productId)
        {
            var stockSummary = await _inventoryRepo.GetProductStockAcrossInventoriesAsync(productId);
            return Ok(stockSummary);
        }
    }
}