using Relation_IMS.Models.PaymentModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.OrderDtos
{
    public class OrderPaymentDTO
    {
        [Required]
        public PaymentMethod PaymentMethod { get; set; }

        [Required]
        [Range(0, double.MaxValue)]
        public decimal Amount { get; set; }

        public string? Note { get; set; }
    }
}
