using Finbuckle.MultiTenant;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models
{
    public enum AuditType
    {
        Create = 1,
        Update = 2,
        Delete = 3
    }

    [MultiTenant]
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }
        
        public int? UserId { get; set; }
        
        [Required]
        [MaxLength(20)]
        public string Type { get; set; } = null!;
        
        [Required]
        [MaxLength(100)]
        public string TableName { get; set; } = null!;
        
        [Required]
        public DateTime DateTime { get; set; }
        
        [MaxLength(255)]
        public string PrimaryKey { get; set; } = null!;
        
        public string? OldValues { get; set; }
        
        public string? NewValues { get; set; }
        
        public string? AffectedColumns { get; set; }
    }
}
