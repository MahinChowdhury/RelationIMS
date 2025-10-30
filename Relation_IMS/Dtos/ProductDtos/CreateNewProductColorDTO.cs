using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateNewProductColorDTO
    {
        [Required(ErrorMessage = "Color name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Color hexcode is required.")]
        public string HexCode { get; set; } = null!;
    }
}
