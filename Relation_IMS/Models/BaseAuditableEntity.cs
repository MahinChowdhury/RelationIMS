using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models
{
    public abstract class BaseAuditableEntity
    {
        [Key]
        public int Id { get; set; }

        public DateTime CreatedAt { get; set; }
        public int? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int? UpdatedBy { get; set; }
    }
}
