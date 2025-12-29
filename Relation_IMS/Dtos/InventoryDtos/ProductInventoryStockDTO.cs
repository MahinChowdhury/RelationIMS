namespace Relation_IMS.Dtos.InventoryDtos
{
    public class ProductInventoryStockDTO
    {
        public int InventoryId { get; set; }
        public string InventoryName { get; set; } = string.Empty;
        public int ProductVariantId { get; set; }
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
