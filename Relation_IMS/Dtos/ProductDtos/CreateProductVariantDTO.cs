using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateProductVariantDTO
    {
        public int ProductId { get; set; }
        [Required(ErrorMessage = "ProductColor Id is required.")]
        public int ProductColorId { get; set; }
        [Required(ErrorMessage = "ProductSize Id is required.")]
        public int ProductSizeId { get; set; }

        [Range(0,int.MaxValue)]
        [Required(ErrorMessage = "Quantity is required.")]
        public int Quantity { get; set; }

        public int DefaultInventoryId { get; set; }

    }
}