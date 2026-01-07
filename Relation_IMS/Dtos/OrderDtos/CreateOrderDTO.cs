using Relation_IMS.Models;
using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.OrderModels;
using Relation_IMS.Models.PaymentModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Dtos.OrderDtos
{
    public class CreateOrderDTO
    {
        [Required(ErrorMessage = "Customer Id is required.")]
        public int CustomerId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "Total order price amount is required.")]
        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; } = 0.0m;
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal Discount { get; set; } = 0.0m;
        [Required(ErrorMessage = "Net amount is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal NetAmount { get; set; } = 0.0m;
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal PaidAmount { get; set; } = 0.0m;
        [Required(ErrorMessage = "Payment status is required.")]
        public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Pending;
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
        public string? Remarks { get; set; }
        
        public List<OrderPaymentDTO>? Payments { get; set; }
    }
}
