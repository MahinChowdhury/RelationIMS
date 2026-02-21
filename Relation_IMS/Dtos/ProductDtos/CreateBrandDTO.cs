using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateBrandDTO
    {
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "At least one Category is required")]
        public List<int> CategoryIds { get; set; } = new List<int>();
    }
}
