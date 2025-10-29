using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class UpdateProductDTO
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double BasePrice { get; set; }
        public int CategoryId { get; set; }
        public int BrandId { get; set; }
        public List<string>? ImageUrls { get; set; }
        public List<ProductVariant>? Variants { get; set; }
    }
}