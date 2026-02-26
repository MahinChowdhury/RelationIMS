using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class InventoryTransferRecord : BaseAuditableEntity
    {
        public List<InventoryTransferRecordItem> TransferItems { get; set; } = new();

        [Required(ErrorMessage = "Source InventoryId is required.")]
        public int SourceInventoryId { get; set; }
        public Inventory? SourceInventory { get; set; } 

        [Required(ErrorMessage = "Destination InventoryId is required.")]
        public int DestinationInventoryId { get; set; }
        public Inventory? DestinationInventory { get; set; } 
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
        public User? User { get; set; }
        public DateTime DateTime { get; set; } = DateTime.UtcNow;
    }
}
