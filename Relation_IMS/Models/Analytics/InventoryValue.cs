using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public class InventoryValue : BaseAuditableEntity
    {
        public int TotalItems { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalValue { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal LastMonthValue { get; set; }
    }
}
