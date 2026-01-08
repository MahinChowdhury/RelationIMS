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

        [Range(0, int.MaxValue)]
        [Required(ErrorMessage = "Quantity is required.")]
        public int Quantity { get; set; }
    }
}
