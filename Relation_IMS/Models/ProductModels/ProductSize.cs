using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductSize : BaseAuditableEntity
    {
        [Required(ErrorMessage = "Size name is required.")]
        public string Name { get; set; } = null!;
        public List<Category>? Categories { get; set; } = new List<Category>();
    }
}