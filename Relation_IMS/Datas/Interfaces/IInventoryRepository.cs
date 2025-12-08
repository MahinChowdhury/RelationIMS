using Relation_IMS.Datas.Repositories;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IInventoryRepository
    {
        Task<List<Inventory>> GetAllInventoriesAsync();
        Task<Inventory?> GetInventoryByIdAsync(int id);
        Task<Inventory> CreateNewInventoryAsync(CreateInventoryDTO inventoryDto);
        Task<Inventory?> UpdateInventoryByIdAsync(int id, CreateInventoryDTO inventoryDto);
        Task<Inventory?> DeleteInventoryByIdAsync(int id);
        Task<bool> TransferProductItemsAsync(int sourceInventoryId, int destinationInventoryId, int productVariantId, int quantity);
        Task<List<InventoryStockDTO>> GetInventoryStockSummaryAsync(int inventoryId);
        Task<List<ProductInventoryStockDTO>> GetProductStockAcrossInventoriesAsync(int productId);
        Task<List<ProductItemSummaryDTO>> GetInventoryProductItemsAsync(int inventoryId);
    }
}