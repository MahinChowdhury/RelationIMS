using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class Quarter
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Quarter Name is required")]
        public string Name { get; set; } = null!;

        public List<Product>? Products { get; set; } = new List<Product>();
    }
}
