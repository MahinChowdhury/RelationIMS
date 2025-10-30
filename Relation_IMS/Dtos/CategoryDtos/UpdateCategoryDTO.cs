using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CategoryDtos
{
    public class UpdateCategoryDTO
    {
        [Required(ErrorMessage = "Category Name is required")]
        public string Name { get; set; } = null!;
        public string Description { get; set; } = string.Empty;
    }
}
