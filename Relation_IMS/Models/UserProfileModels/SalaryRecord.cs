using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.UserProfileModels
{
    public class SalaryRecord : BaseAuditableEntity
    {
        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [Required]
        [MaxLength(20)]
        public string Month { get; set; } = null!;

        [Required]
        public int Year { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "paid"; // "paid" or "pending"

        public DateTime? PaidDate { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
