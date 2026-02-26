using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.JWTDtos
{
    public class UserLoginDTO
    {
        // Phone number input from the user during login.
        [Required(ErrorMessage = "Phone number is required.")]
        [MaxLength(20, ErrorMessage = "Phone number must be less than or equal to 20 characters.")]
        public string PhoneNumber { get; set; } = null!;
        // Password input from the user during login.
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        [MaxLength(100, ErrorMessage = "Password must be less than or equal to 100 characters.")]
        public string Password { get; set; } = null!;
        [Required(ErrorMessage = "ClientId is required.")]
        public string ClientId { get; set; } = null!;
    }
}