using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class CreateProductFormDTO
    {
        [Required(ErrorMessage = "Product name is required.")]
        public string Name { get; set; } = null!;
        
        public string? Description { get; set; }
        
        [Range(0, double.MaxValue)]
        public decimal BasePrice { get; set; } = 0.0m;

        [Range(0, double.MaxValue)]
        public decimal CostPrice { get; set; } = 0.0m;

        [Range(0, double.MaxValue)]
        public decimal MSRP { get; set; } = 0.0m;
        
        [Required(ErrorMessage = "Category Id is required.")]
        public int CategoryId { get; set; }
        
        [Required(ErrorMessage = "Brand Id is required.")]
        public int BrandId { get; set; }

        [Required(ErrorMessage = "Quarter Id is required.")]
        public int QuarterId { get; set; }

        public List<IFormFile>? Images { get; set; }
    }
}
