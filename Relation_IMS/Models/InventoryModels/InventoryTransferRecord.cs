using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class InventoryTransferRecord
    {
        public int Id { get; set; }

        public List<ProductItem> ProductItems { get; set; } = new();

        [Required(ErrorMessage = "Source InventoryId is required.")]
        public int SourceInventoryId { get; set; }
        public Inventory? SourceInventory { get; set; } // Added navigation property

        [Required(ErrorMessage = "Destination InventoryId is required.")]
        public int DestinationInventoryId { get; set; }
        public Inventory? DestinationInventory { get; set; } // Added navigation property
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime DateTime { get; set; } = DateTime.UtcNow;
    }
}
