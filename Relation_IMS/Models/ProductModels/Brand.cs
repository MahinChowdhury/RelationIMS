using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class Brand
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        public List<Product>? Products { get; set; }
    }
}