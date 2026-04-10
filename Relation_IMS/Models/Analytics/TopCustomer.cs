using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Relation_IMS.Models.Analytics
{
    public enum TopCustomerPeriodType
    {
        AllTime = 0
    }

    [Index(nameof(PeriodType))]
    public class TopCustomer : BaseAuditableEntity
    {
        [Required]
        public int CustomerId { get; set; }
        
        [Required]
        public string CustomerName { get; set; } = string.Empty;
        
        public string? CustomerImageUrl { get; set; }
        
        public int TotalPurchases { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }
        
        [Required]
        public TopCustomerPeriodType PeriodType { get; set; }
    }
}
