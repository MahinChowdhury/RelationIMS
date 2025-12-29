using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class Inventory
    {
        public int Id { get; set; }
        [Required]
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public List<ProductItem>? ProductItems { get; set; } = new();
    }
}