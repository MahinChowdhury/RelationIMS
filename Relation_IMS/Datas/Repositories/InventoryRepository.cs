using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public InventoryRepository(ApplicationDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<Inventory> CreateNewInventoryAsync(CreateInventoryDTO inventoryDto)
        {
            var inventory = _mapper.Map<Inventory>(inventoryDto);
            await _context.Inventories.AddAsync(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        public async Task<Inventory?> DeleteInventoryByIdAsync(int id)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null) return null;

            _context.Inventories.Remove(inventory);
            await _context.SaveChangesAsync();

            return inventory;
        }

        public async Task<List<Inventory>> GetAllInventoriesAsync()
        {
            var inventories = await _context.Inventories.ToListAsync();

            return inventories;
        }

        public async Task<Inventory?> GetInventoryByIdAsync(int id)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null) return null;

            return inventory;
        }

        public async Task<Inventory?> UpdateInventoryByIdAsync(int id, CreateInventoryDTO inventoryDto)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null) return null;

            inventory.Name = inventoryDto.Name;
            inventory.Description = inventoryDto.Description;

            await _context.SaveChangesAsync();

            return inventory;
        }
    }
}
