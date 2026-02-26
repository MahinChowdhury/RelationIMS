using Relation_IMS.Models.CustomerModels;
using Relation_IMS.Models.PaymentModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.OrderModels
{
    public class Order : BaseAuditableEntity
    {
        [Required(ErrorMessage = "Customer Id is required.")]
        public int CustomerId { get; set; }
        public Customer? Customer { get; set; }
        public List<OrderItem>? OrderItems { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "Total order price amount is required.")]
        [Range(0, double.MaxValue)]
        public decimal TotalAmount { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal Discount { get; set; } = 0.0m;
        [Required(ErrorMessage = "Net amount is required.")]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal NetAmount { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal PaidAmount { get; set; } = 0.0m;
        [Required(ErrorMessage = "Payment status is required.")]
        public PaymentStatus PaymentStatus { get; set; }
        [Required(ErrorMessage = "UserId is required.")]
        public int UserId { get; set; }
        public User? User { get; set; }
        public ICollection<OrderPayment>? Payments { get; set; }
        public string? Remarks { get; set; }

        public DateTime? NextPaymentDate { get; set; }
        public OrderInternalStatus InternalStatus { get; set; } = OrderInternalStatus.Created;
    }
}