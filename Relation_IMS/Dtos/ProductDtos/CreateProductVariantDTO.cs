using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateProductVariantDTO
    {
        public int ProductId { get; set; }
        public int ProductColorId { get; set; }

        public int ProductSizeId { get; set; }
        [Required(ErrorMessage = "Variant Price is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double VariantPrice { get; set; }

        [Range(0,int.MaxValue)]
        [Required(ErrorMessage = "Quantity is required.")]
        public int Quantity { get; set; }

        public int DefaultInventoryId { get; set; }

    }
}