using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace Relation_IMS.Models
{
    [Index(nameof(CreatedAt))]
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
