using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.JWTDtos
{
    // DTO returned when listing users
    public class UserListDTO
    {
        public int Id { get; set; }
        public string Firstname { get; set; } = null!;
        public string? Lastname { get; set; }
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public bool IsActive { get; set; }
        public string PreferredLanguage { get; set; } = "en";
        // Single role per user
        public string Role { get; set; } = "";
        public int? ShopNo { get; set; }
    }

    // DTO for updating a user
    public class UserUpdateDTO
    {
        [Required(ErrorMessage = "First name is required.")]
        [MaxLength(50)]
        public string Firstname { get; set; } = null!;

        [MaxLength(50)]
        public string? Lastname { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = null!;

        [EmailAddress(ErrorMessage = "Invalid email address.")]
        public string? Email { get; set; }

        public bool IsActive { get; set; } = true;

        // Single role name to assign
        [Required(ErrorMessage = "Role is required.")]
        public string Role { get; set; } = null!;

        public decimal? CurrentSalary { get; set; }
        public int? ShopNo { get; set; }
    }

    // DTO for admin creating a user (includes role assignment)
    public class AdminCreateUserDTO
    {
        [Required(ErrorMessage = "First name is required.")]
        [MaxLength(50)]
        public string Firstname { get; set; } = null!;

        [MaxLength(50)]
        public string? Lastname { get; set; }

        [Required(ErrorMessage = "Phone number is required.")]
        [MaxLength(20)]
        public string PhoneNumber { get; set; } = null!;

        [EmailAddress(ErrorMessage = "Invalid email address.")]
        public string? Email { get; set; }

        [Required(ErrorMessage = "Password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string Password { get; set; } = null!;

        // Single role name (e.g. "Salesman")
        [Required(ErrorMessage = "Role is required.")]
        public string Role { get; set; } = null!;

        [MaxLength(200)]
        public string? Address { get; set; }

        [Range(0, double.MaxValue)]
        public decimal CurrentSalary { get; set; }
        public int ShopNo { get; set; } = 0;
    }

    // DTO for roles list
    public class RoleDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
    }
}
