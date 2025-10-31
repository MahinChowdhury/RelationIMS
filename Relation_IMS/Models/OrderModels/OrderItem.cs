using Relation_IMS.Models.ProductModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.OrderModels
{
    public class OrderItem
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Order id is required.")]
        public int OrderId { get; set; }
        public Order? Order { get; set; }
        [Required(ErrorMessage = "Product id is required.")]
        public int ProductId { get; set; }
        public Product? Product { get; set; }

        [Required(ErrorMessage = "Item quantity is required.")]
        [Range(0,int.MaxValue)]
        public int Quantity { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "unit price is required.")]
        [Range(0, double.MaxValue)]
        public double UnitPrice { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        [Required(ErrorMessage = "SubTotal amount is required.")]
        [Range(0, double.MaxValue)]
        public decimal Subtotal { get; set; } 
    }
}