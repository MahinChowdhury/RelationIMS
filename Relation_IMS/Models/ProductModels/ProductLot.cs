using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductLot
    {
        [Key]
        public int Id { get; set; }
        public string? Code { get; set; }
        public string? Description { get; set; }
        [Required]
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        [Required]
        public int LotQuantity { get; set; }
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;
    }
}
