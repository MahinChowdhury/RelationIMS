namespace Relation_IMS.Dtos.ProductDtos
{
    public class ProductItemResponseDTO
    {
        public int Id { get; set; }
        public string Code { get; set; } = null!;
        public int ProductVariantId { get; set; }
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
        
        // Product Variant Information
        public decimal VariantPrice { get; set; }
        public string? ColorName { get; set; }
        public string? SizeName { get; set; }
        
        // Product Information
        public int ProductId { get; set; }
        public string ProductName { get; set; } = null!;
        public decimal BasePrice { get; set; }
        public decimal MSRP { get; set; }
        public List<string>? ImageUrls { get; set; }
        public string? ThumbnailUrl { get; set; }
    }
}
