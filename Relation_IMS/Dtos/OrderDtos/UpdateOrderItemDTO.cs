using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.OrderDtos
{
    public class UpdateOrderItemDTO
    {
        public int OrderId { get; set; }
        [Required(ErrorMessage = "Product id is required.")]
        public int ProductId { get; set; }

        [Required(ErrorMessage = "Item quantity is required.")]
        [Range(0, int.MaxValue)]
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "unit price is required.")]
        [Range(0, double.MaxValue)]
        public decimal UnitPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal Discount { get; set; } = 0.0m;
        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "SubTotal amount is required.")]
        [Range(0, double.MaxValue)]
        public decimal Subtotal { get; set; }
    }
}
