using Relation_IMS.Models.OrderModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.CustomerModels
{
    public class Customer
    {
        public int Id { get; set; }
        [Required(ErrorMessage = "Customer name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Not a valid phone number")]
        public string Phone { get; set; } = null!;
        public string? Email { get; set; }
        [Required(ErrorMessage = "Customer Address is required.")]
        public string Address { get; set; } = null!;
        public List<Order>? Orders { get; set; }
        public DateTime? CreatedDate { get; set; } = DateTime.UtcNow;
    }
}