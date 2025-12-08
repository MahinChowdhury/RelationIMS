using Microsoft.AspNetCore.Mvc.ViewFeatures;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductItem
    {
        public int Id { get; set; }

        [Required]
        public int ProductVariantId { get; set; }
        public ProductVariant? ProductVariant { get; set; }
        [Required]
        public string Code { get; set; } = null!; 
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
        [Required]
        public int InventoryId { get; set; }
        public Inventory? Inventory { get; set; }
    }
}