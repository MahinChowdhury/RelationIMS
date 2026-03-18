using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public enum SalesOverviewPeriodType
    {
        ThisWeek = 0,
        ThisMonth = 1
    }

    public class SalesOverview : BaseAuditableEntity
    {
        [Required]
        public SalesOverviewPeriodType PeriodType { get; set; }
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalRevenue { get; set; }
        
        public int OrderCount { get; set; }
    }
}
