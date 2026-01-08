using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CustomerDtos
{
    public class UpdateCustomerDTO
    {
        [Required(ErrorMessage = "Customer name is required.")]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Phone number is required.")]
        [Phone(ErrorMessage = "Not a valid phone number")]
        public string Phone { get; set; } = null!;

        [Required(ErrorMessage = "Customer Address is required.")]
        public string Address { get; set; } = null!;
        [Required(ErrorMessage = "Shop name is required.")]
        public string ShopName { get; set; } = null!;
        [Required(ErrorMessage = "Shop address is required.")]
        public string ShopAddress { get; set; } = null!;
    }
}
