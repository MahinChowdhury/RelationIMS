using Relation_IMS.Models.InventoryModels;

namespace Relation_IMS.Dtos.InventoryDtos
{
    public class VariantStockDTO
    {
        public int InventoryId { get; set; }
        public Inventory? Inventory { get; set; }
        public int Quantity { get; set; }
    }
}
