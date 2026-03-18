using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.Analytics
{
    public class CustomerInsightAllTime : BaseAuditableEntity
    {
        [Key]
        public int Id { get; set; }

        public int NewCustomerCount { get; set; }

        public int ReturningCustomerCount { get; set; }

        public int TotalCustomers { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal NewCustomerPercentage { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ReturningCustomerPercentage { get; set; }

        public DateTime CalculatedAt { get; set; }
    }
}
