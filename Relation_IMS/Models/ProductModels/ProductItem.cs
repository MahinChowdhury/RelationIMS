using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Relation_IMS.Models.InventoryModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductItem
    {
        [Key]
        public int Id { get; set; }

        public int? ProductLotId { get; set; }
        public ProductLot? ProductLot { get; set; }

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

        public int? OrderItemId { get; set; }
        public Models.OrderModels.OrderItem? OrderItem { get; set; }
    }
}