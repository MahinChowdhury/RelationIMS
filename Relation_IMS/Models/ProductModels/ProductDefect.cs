using Relation_IMS.Models.JWTModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductDefect
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int ProductItemId { get; set; }

        [ForeignKey("ProductItemId")]
        public ProductItem? ProductItem { get; set; }

        public string Reason { get; set; } = "Unknown";
        public string Status { get; set; } = "Pending Review"; // e.g., Pending Review, Discarded, Returned, Sold, Restored

        public int? ReportedByUserId { get; set; }

        [ForeignKey("ReportedByUserId")]
        public User? ReportedByUser { get; set; }

        public DateTime DefectDate { get; set; } = DateTime.UtcNow;

        public string? ResolutionAction { get; set; } // e.g., "Sold", "Restored"
        public DateTime? ResolutionDate { get; set; }
    }
}
