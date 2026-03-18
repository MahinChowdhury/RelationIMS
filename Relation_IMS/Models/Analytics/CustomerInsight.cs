using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public class CustomerInsight : BaseAuditableEntity
    {
        [Required]
        public int Year { get; set; }

        [Required]
        public int Month { get; set; }

        public int NewCustomerCount { get; set; }

        public int ReturningCustomerCount { get; set; }

        public int TotalCustomers { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal NewCustomerPercentage { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ReturningCustomerPercentage { get; set; }
    }
}
