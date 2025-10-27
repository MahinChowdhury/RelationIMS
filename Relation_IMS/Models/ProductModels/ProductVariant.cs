using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels;
public class ProductVariant
{
    public int Id { get; set; }
        
    public int ProductId { get; set; }
    public Product? Product { get; set; }

    public int ProductColorId { get; set; }
    public ProductColor? Color { get; set; }

    public int ProductSizeId { get; set; }
    public ProductSize? Size { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    [Range(0, double.MaxValue)]
    public double VariantPrice { get; set; }

    [Range(0, int.MaxValue)]
    public int Quantity { get; set; } = 0;
}