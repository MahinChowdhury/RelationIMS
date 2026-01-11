using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductModels
{
    public class CreateExistingProductLotDto
    {
        [Required]
        public int ProductId { get; set; }
        [Required]
        [Range(1, int.MaxValue)]
        public int LotQuantity { get; set; }
        public string? Description { get; set; }
    }
}
