using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.UserProfileModels
{
    public class UserProfile : BaseAuditableEntity
    {
        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User User { get; set; } = null!;

        [MaxLength(200)]
        public string? Address { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentSalary { get; set; }

        public DateTime JoinDate { get; set; } = DateTime.UtcNow;
    }
}
