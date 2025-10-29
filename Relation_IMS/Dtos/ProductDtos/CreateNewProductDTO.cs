using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateNewProductDTO
    {
        public string Name { get; set; } = string.Empty;
        public List<string>? ImageUrls { get; set; }
        public string? Description { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double BasePrice { get; set; } = 0.0;
        public int CategoryId { get; set; }
        public int BrandId { get; set; }
    }
}
