using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public class StaffPerformanceMonthly : BaseAuditableEntity
    {
        [Required]
        public int UserId { get; set; }

        public User? User { get; set; }

        [Required]
        public int Year { get; set; }

        [Required]
        public int Month { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalSales { get; set; }

        public int OrderCount { get; set; }

        public int Rank { get; set; }
    }
}
