using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CategoryDtos
{
    public class CreateCategoryDTO
    {
        [Required(ErrorMessage = "Category Name is required")]
        public string Name { get; set; } = null!;
    }
}
