using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.OrderModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class CustomerReturnRecord : BaseAuditableEntity
    {
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public decimal RefundAmount { get; set; }
        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
        public int? UserId { get; set; } // Processed by (optional for now)

        public int? OrderId { get; set; }
        public Order? Order { get; set; }

        public List<CustomerReturnItem> ReturnItems { get; set; } = new();
    }
}
