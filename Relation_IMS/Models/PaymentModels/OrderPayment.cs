using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Relation_IMS.Models.OrderModels;

namespace Relation_IMS.Models.PaymentModels
{
    public class OrderPayment
    {
        public int Id { get; set; }
        
        public int OrderId { get; set; }
        public Order? Order { get; set; }

        public PaymentMethod PaymentMethod { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        [Range(0, double.MaxValue)]
        public decimal Amount { get; set; }

        public string? Note { get; set; }
    }
}
