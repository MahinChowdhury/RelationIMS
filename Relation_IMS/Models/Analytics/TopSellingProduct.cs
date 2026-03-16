using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public enum TopSellingPeriodType
    {
        Last30Days = 0,
        ThisQuarter = 1
    }

    public class TopSellingProduct : BaseAuditableEntity
    {
        [Required]
        public int ProductId { get; set; }
        
        [Required]
        public string ProductName { get; set; } = string.Empty;
        
        public string? ProductImageUrl { get; set; }
        
        [Required]
        public int TotalQuantitySold { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }
        
        [Required]
        public TopSellingPeriodType PeriodType { get; set; }
    }
}
