namespace Relation_IMS.Dtos.InventoryDtos
{
    public class ProductItemSummaryDTO
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int ProductId { get; set; }
        public int ProductVariantId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public string? ProductImageUrl { get; set; }
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
    }
}
