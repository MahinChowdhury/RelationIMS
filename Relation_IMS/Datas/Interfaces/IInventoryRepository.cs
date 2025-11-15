using Relation_IMS.Dtos;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IInventoryRepository
    {
        Task<List<Inventory>> GetAllInventoriesAsync();
        Task<Inventory?> GetInventoryByIdAsync(int id);
        Task<Inventory?> DeleteInventoryByIdAsync(int id);
        Task<Inventory> CreateNewInventoryAsync(CreateInventoryDTO inventoryDto);
        Task<Inventory?> UpdateInventoryByIdAsync(int id, CreateInventoryDTO inventoryDto);
    }
}
