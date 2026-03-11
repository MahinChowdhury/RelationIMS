using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateNewProductSizeDTO
    {
        [Required(ErrorMessage = "Size name is required.")]
        public string Name { get; set; } = null!;
        public List<int> CategoryIds { get; set; } = new List<int>();
    }
}
