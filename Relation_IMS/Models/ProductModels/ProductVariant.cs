using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels;
public class ProductVariant
{
    public int Id { get; set; }
    [Required(ErrorMessage = "Product id is required.")]
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    [Required(ErrorMessage = "Color id is required.")]
    public int ProductColorId { get; set; }
    public ProductColor? Color { get; set; }
    [Required(ErrorMessage = "Size id is required.")]
    public int ProductSizeId { get; set; }
    public ProductSize? Size { get; set; }
    [Required(ErrorMessage = "Variant Price is required.")]
    [Column(TypeName = "decimal(18,2)")]
    [Range(0, double.MaxValue)]
    public double VariantPrice { get; set; }
    [Required(ErrorMessage = "Quantity is required.")]
    [Range(0, int.MaxValue)]
    public int Quantity { get; set; } = 0;

    public List<ProductItem>? ProductItems { get; set; }
}