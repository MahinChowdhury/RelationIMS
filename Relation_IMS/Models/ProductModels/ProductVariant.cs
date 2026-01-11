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
    public int Quantity => ProductItems?
            .Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0;
    public int Defects => ProductItems?
            .Count(pi => pi.IsDefected) ?? 0;
    [Column(TypeName = "decimal(18,2)")]
    public decimal VariantPrice { get; set; }
    public List<ProductItem>? ProductItems { get; set; }
}