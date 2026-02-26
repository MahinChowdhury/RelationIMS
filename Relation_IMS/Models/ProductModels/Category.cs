using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels;
public class Category : BaseAuditableEntity
{
    [MaxLength(1)]
    public string? Code { get; set; }
    [Required(ErrorMessage = "Category Name is required")]
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public List<Product>? Products { get; set; } = new List<Product>();
    public List<Brand>? Brands { get; set; }
}
