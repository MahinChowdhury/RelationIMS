using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateNewProductDTO
    {
        [Required(ErrorMessage = "Product name is required.")]
        public string Name { get; set; } = null!;
        public List<string>? ImageUrls { get; set; }
        public string? Description { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double BasePrice { get; set; } = 0.0;
        [Required(ErrorMessage = "Category Id is required.")]
        public int CategoryId { get; set; }
        [Required(ErrorMessage = "Brand Id is required.")]
        public int BrandId { get; set; }
    }
}
