using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IInventoryValueRepository
    {
        Task<InventoryValue?> GetInventoryValueAsync();
        Task UpdateInventoryValueAsync(InventoryValue inventoryValue);
    }
}
