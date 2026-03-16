using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Repositories
{
    public class InventoryValueRepository : IInventoryValueRepository
    {
        private readonly ApplicationDbContext _context;

        public InventoryValueRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<InventoryValue?> GetInventoryValueAsync()
        {
            return await _context.InventoryValues
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync();
        }

        public async Task UpdateInventoryValueAsync(InventoryValue inventoryValue)
        {
            var existing = await _context.InventoryValues
                .OrderByDescending(i => i.Id)
                .FirstOrDefaultAsync();

            if (existing != null)
            {
                existing.TotalItems = inventoryValue.TotalItems;
                existing.TotalValue = inventoryValue.TotalValue;
                existing.LastMonthValue = inventoryValue.LastMonthValue;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                inventoryValue.CreatedAt = DateTime.UtcNow;
                await _context.InventoryValues.AddAsync(inventoryValue);
            }

            await _context.SaveChangesAsync();
        }
    }
}
