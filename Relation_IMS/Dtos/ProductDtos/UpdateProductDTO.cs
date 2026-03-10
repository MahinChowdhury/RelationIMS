using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class UpdateProductDTO
    {
        [Required(ErrorMessage = "Product name is required.")]
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        [Required(ErrorMessage = "Product Price is required.")]
        public decimal BasePrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal CostPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal MSRP { get; set; }
        [Required(ErrorMessage = "Category Id is required.")]
        public int CategoryId { get; set; }
        [Required(ErrorMessage = "Brand Id is required.")]
        public int BrandId { get; set; }
        [Required(ErrorMessage = "At least one Quarter is required.")]
        public List<int> QuarterIds { get; set; } = new List<int>();
        public List<string>? ImageUrls { get; set; }
        public string? ThumbnailUrl { get; set; }
        public List<ProductVariant>? Variants { get; set; }
    }
}