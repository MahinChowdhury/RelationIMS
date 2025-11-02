using Relation_IMS.Models.PaymentModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.OrderDtos
{
    public class UpdateOrderDTO
    {
        [Required(ErrorMessage = "Customer Id is required.")]
        public int CustomerId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "Total order price amount is required.")]
        [Range(0, double.MaxValue)]
        public double TotalAmount { get; set; } = 0.0;
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double Discount { get; set; } = 0.0;
        [Required(ErrorMessage = "Net amount is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public double NetAmount { get; set; } = 0.0;
        [Required(ErrorMessage = "Payment status is required.")]
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
        public string? Remarks { get; set; }
    }
}
