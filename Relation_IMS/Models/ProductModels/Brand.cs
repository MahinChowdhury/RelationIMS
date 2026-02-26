using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class Brand : BaseAuditableEntity
    {
        [Required(ErrorMessage = "Brand Name is required")]
        public string Name { get; set; } = null!;

        public List<Category>? Categories { get; set; } = new List<Category>();

        public List<Product>? Products { get; set; }
    }
}