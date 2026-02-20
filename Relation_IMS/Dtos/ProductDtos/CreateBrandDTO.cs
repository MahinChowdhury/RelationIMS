using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateBrandDTO
    {
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Category is required")]
        public int CategoryId { get; set; }
    }
}
