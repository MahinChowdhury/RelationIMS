using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class CustomerReturnItem : BaseAuditableEntity
    {
        public int CustomerReturnRecordId { get; set; }
        public CustomerReturnRecord? CustomerReturnRecord { get; set; }

        public int ProductItemId { get; set; }
        public ProductItem? ProductItem { get; set; }
    }
}
