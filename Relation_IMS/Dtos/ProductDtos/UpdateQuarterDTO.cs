using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class UpdateQuarterDTO
    {
        [Required(ErrorMessage = "Quarter Name is required")]
        public string Name { get; set; } = null!;
    }
}
