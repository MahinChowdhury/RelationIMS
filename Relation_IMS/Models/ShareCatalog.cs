using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models
{
    public class ShareCatalog : BaseAuditableEntity
    {
        [Required]
        [MaxLength(100)]
        public string ShareHash { get; set; } = null!;

        [Required]
        public int OwnerId { get; set; }

        [ForeignKey(nameof(OwnerId))]
        public User? Owner { get; set; }

        [Required]
        [MaxLength(100)]
        public string Password { get; set; } = null!;

        [Required]
        public DateTime ExpiresAt { get; set; }
    }
}
