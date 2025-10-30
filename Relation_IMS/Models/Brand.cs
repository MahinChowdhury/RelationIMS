using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models
{
    public class Brand
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        public List<Product>? Products { get; set; }
    }
}