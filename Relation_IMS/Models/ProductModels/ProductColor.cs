using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.ProductModels
{
    public class ProductColor
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Color name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Color Hexcode is required.")]
        public string HexCode { get; set; } = null!;
    }
}
