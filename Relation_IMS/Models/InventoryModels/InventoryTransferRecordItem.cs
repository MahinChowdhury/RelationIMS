using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class InventoryTransferRecordItem : BaseAuditableEntity
    {
        public int InventoryTransferRecordId { get; set; }
        public InventoryTransferRecord? InventoryTransferRecord { get; set; }

        public int ProductItemId { get; set; }
        public ProductItem? ProductItem { get; set; }
    }
}
