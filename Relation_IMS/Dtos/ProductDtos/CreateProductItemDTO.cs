namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateProductItemDTO
    {
        public int ProductVariantId { get; set; }
        public string Code { get; set; } = null!;
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
        public int InventoryId { get; set; }
    }
}
