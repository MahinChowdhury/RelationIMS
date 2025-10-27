using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.JWTDtos
{
    public class UserRegisterDTO
    {
        [Required(ErrorMessage = "First name is required.")]
        [MaxLength(50, ErrorMessage = "First name must be less than or equal to 50 characters.")]
        public string Firstname { get; set; } = null!;
        [MaxLength(50, ErrorMessage = "Last name must be less than or equal to 50 characters.")]
        public string? Lastname { get; set; }
        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = null!;

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        public string Email { get; set; } = null!;
        
    }
}
