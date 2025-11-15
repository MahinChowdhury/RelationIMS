using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Models;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class InventoryController : ControllerBase
    {
        private readonly IInventoryRepository _repo;
        public InventoryController(IInventoryRepository repo)
        {
            _repo = repo;
        }
        [HttpGet]
        public async Task<ActionResult<List<Inventory>>> GetAllInventories() {
            var inventories = await _repo.GetAllInventoriesAsync();

            return Ok(inventories);
        }
        [HttpGet("{id:int}")]
        public async Task<ActionResult<Inventory>?> GetInventoryById([FromRoute] int id) {
            var inventory = await _repo.GetInventoryByIdAsync(id);
            if(inventory == null) return NotFound(new { message = $"Inventory with id : {id} not found."});

            return inventory;
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult<Inventory>?> DeleteInventoryById([FromRoute] int id)
        {
            var inventory = await _repo.DeleteInventoryByIdAsync(id);
            if (inventory == null) return NotFound(new { message = $"Inventory with id : {id} not found." });

            return inventory;
        }
        [HttpPost]
        public async Task<ActionResult<Inventory>> CreateNewInventory(CreateInventoryDTO inventoryDto) {
            var created = await _repo.CreateNewInventoryAsync(inventoryDto);

            return CreatedAtAction(nameof(GetInventoryById), new { id = created.Id }, created);
        }
        [HttpPut("{id:int}")]
        public async Task<ActionResult<Inventory?>> UpdateInventory([FromRoute] int id, CreateInventoryDTO inventoryDto) {
            var updated = await _repo.UpdateInventoryByIdAsync(id, inventoryDto);
            if (updated == null) return NotFound(new { message = $"inventory with id : {id} not found."});

            return Ok(updated);
        }
    }
}
