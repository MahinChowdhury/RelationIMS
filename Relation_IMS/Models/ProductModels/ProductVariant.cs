using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels;
public class ProductVariant : BaseAuditableEntity
{
    [Required(ErrorMessage = "Product id is required.")]
    public int ProductId { get; set; }
    public Product? Product { get; set; }
    [Required(ErrorMessage = "Color id is required.")]
    public int ProductColorId { get; set; }
    public ProductColor? Color { get; set; }
    [Required(ErrorMessage = "Size id is required.")]
    public int ProductSizeId { get; set; }
    public ProductSize? Size { get; set; }
    private int? _quantity;
    [NotMapped]
    public int Quantity 
    { 
        get => _quantity ?? (ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold && pi.OrderItemId == null) ?? 0);
        set => _quantity = value;
    }
    public int ReservedQuantity { get; set; }
    
    private int? _defects;
    [NotMapped]
    public int Defects 
    { 
        get => _defects ?? (ProductItems?.Count(pi => pi.IsDefected) ?? 0);
        set => _defects = value;
    }
    public int AvailableForSale => Quantity - ReservedQuantity;
    [Column(TypeName = "decimal(18,2)")]
    public decimal VariantPrice { get; set; }
    public List<ProductItem>? ProductItems { get; set; }
}