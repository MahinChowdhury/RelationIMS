using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class UpdateProductVariantDTO
    {
        public int ProductColorId { get; set; }

        public int ProductSizeId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double VariantPrice { get; set; }

        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }
    }
}
