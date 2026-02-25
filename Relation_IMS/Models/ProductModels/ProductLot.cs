using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductLot : BaseAuditableEntity
    {
        public string? Code { get; set; }
        public string? Description { get; set; }
        [Required]
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        [Required]
        public int LotQuantity { get; set; }
    }
}
