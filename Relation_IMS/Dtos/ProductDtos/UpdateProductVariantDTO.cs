using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class UpdateProductVariantDTO
    {
        [Required(ErrorMessage = "Color id is required.")]
        public int ProductColorId { get; set; }
        [Required(ErrorMessage = "Size id is required.")]
        public int ProductSizeId { get; set; }

        [Required(ErrorMessage = "Variant Price is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal VariantPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal CostPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal MSRP { get; set; }

        [Range(0, int.MaxValue)]
        [Required(ErrorMessage = "Quantity is required.")]
        public int Quantity { get; set; }
    }
}
