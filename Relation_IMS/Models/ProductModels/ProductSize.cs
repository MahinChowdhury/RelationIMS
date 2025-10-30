using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductSize
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Size name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "The categoryId is required.")]
        public int CategoryId { get; set; }
    }
}