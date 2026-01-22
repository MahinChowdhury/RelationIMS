using Relation_IMS.Models.CustomerModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.InventoryModels
{
    public class CustomerReturnRecord
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }

        public decimal RefundAmount { get; set; }
        public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
        public int? UserId { get; set; } // Processed by (optional for now)

        public List<CustomerReturnItem> ReturnItems { get; set; } = new();
    }
}
