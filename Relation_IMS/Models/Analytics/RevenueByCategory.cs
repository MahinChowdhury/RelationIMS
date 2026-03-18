using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Relation_IMS.Models.Analytics;

namespace Relation_IMS.Models.Analytics
{
    public class RevenueByCategory : BaseAuditableEntity
    {
        [Required]
        public int CategoryId { get; set; }
        
        [Required]
        public string CategoryName { get; set; } = string.Empty;
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }
        
        public int TotalQuantitySold { get; set; }
        
        [Required]
        public TopSellingPeriodType PeriodType { get; set; }
    }
}
