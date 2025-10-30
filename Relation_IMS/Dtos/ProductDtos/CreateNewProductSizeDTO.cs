using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateNewProductSizeDTO
    {
        [Required(ErrorMessage = "Size name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "The categoryId is required.")]
        public int CategoryId { get; set; }
    }
}
