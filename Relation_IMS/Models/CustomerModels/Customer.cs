using Relation_IMS.Models.OrderModels;
using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Models.CustomerModels
{
    public class Customer : BaseAuditableEntity
    {
        [Required(ErrorMessage = "Customer name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Not a valid phone number")]
        public string Phone { get; set; } = null!;
        [Required(ErrorMessage = "Address is required.")]
        public string Address { get; set; } = null!;
        [Required(ErrorMessage = "Shop name is required.")]
        public string ShopName { get; set; } = null!;
        [Required(ErrorMessage = "Shop address is required.")]
        public string ShopAddress { get; set; } = null!;
        public List<Order>? Orders { get; set; }
        public bool IsDueAllowed { get; set; } = false;
        public string NidNumber { get; set; } = string.Empty;
        public string ReferenceName { get; set; } = string.Empty;
        public string ReferencePhoneNumber { get; set; } = string.Empty;
        
        [Range(0, double.MaxValue, ErrorMessage = "Balance cannot be negative.")]
        public decimal Balance { get; set; } = 0;
        
        public bool IsActive { get; set; } = true;
    }
}