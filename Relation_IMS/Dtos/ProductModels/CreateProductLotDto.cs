using System.ComponentModel.DataAnnotations;
using Relation_IMS.Dtos.ProductDtos;

namespace Relation_IMS.Dtos.ProductModels
{
    public class CreateProductLotDto
    {
        [Required]
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        [Required]
        public decimal BasePrice { get; set; }
        public decimal CostPrice { get; set; }
        public decimal MSRP { get; set; }
        [Required]
        public int BrandId { get; set; }
        [Required]
        public int CategoryId { get; set; }
        [Required]
        public int LotQuantity { get; set; }
        public List<LotVariantDto> Variants { get; set; } = new();
        public List<IFormFile>? Images { get; set; } 
    }

    public class LotVariantDto
    {
        public int ColorId { get; set; }
        public int SizeId { get; set; }
    }
}
