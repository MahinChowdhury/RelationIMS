using Microsoft.AspNetCore.Mvc.ViewFeatures;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductItem
    {
        public int Id { get; set; }
        
        public int ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }
        public string Code { get; set; } = null!; 
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
        public int InventoryId { get; set; }
        public Inventory? Inventory { get; set; }
    }
}