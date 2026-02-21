using Relation_IMS.Models.OrderModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.ProductModels
{
    public class Product
    {
        public int Id { get; set; }
        public string? Code { get; set; } 
        [Required(ErrorMessage = "Product name is required.")]
        public string Name { get; set; } = null!;
        public List<string>? ImageUrls { get; set; }
        public string? Description { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "Product Price is required.")]
        [Range(0, double.MaxValue)]
        public decimal BasePrice { get; set; } = 0.0m;
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal CostPrice { get; set; } = 0.0m;
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal MSRP { get; set; } = 0.0m;
        [Range(0, int.MaxValue)]
        public int TotalQuantity { get; set; } = 0;
        [Required(ErrorMessage = "Category Id is required.")]
        public int CategoryId { get; set; }
        public Category? Category { get; set; }
        [Required(ErrorMessage = "Brand Id is required.")]
        public int BrandId { get; set; }
        public Brand? Brand { get; set; }

        public List<Quarter>? Quarters { get; set; } = new List<Quarter>();
        public List<ProductVariant>? Variants { get; set; } = new();
        public ProductLot? Lot { get; set; }
        public List<OrderItem>? OrderItems { get; set; }
    }
}