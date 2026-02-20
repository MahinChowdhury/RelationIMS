using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class Brand
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Category is required")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }

        public List<Product>? Products { get; set; }
    }
}