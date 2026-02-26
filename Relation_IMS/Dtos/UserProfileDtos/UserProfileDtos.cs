using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.UserProfileDtos
{
    // Full user profile response (combines User + UserProfile data)
    public class UserProfileDTO
    {
        public int Id { get; set; }
        public string Firstname { get; set; } = null!;
        public string? Lastname { get; set; }
        public string Email { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public bool IsActive { get; set; }
        public string PreferredLanguage { get; set; } = "en";
        public string Role { get; set; } = "";
        public string? Address { get; set; }
        public decimal CurrentSalary { get; set; }
        public DateTime JoinDate { get; set; }
    }

    // DTO for creating / updating profile-specific fields
    public class UpdateUserProfileDTO
    {
        [MaxLength(50)]
        public string? Firstname { get; set; }

        [MaxLength(50)]
        public string? Lastname { get; set; }

        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        public string? Email { get; set; }

        [MaxLength(20)]
        public string? PhoneNumber { get; set; }

        [MaxLength(200)]
        public string? Address { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Salary must be a positive value.")]
        public decimal CurrentSalary { get; set; }
    }

    // DTO for changing password
    public class ChangePasswordDTO
    {
        [Required(ErrorMessage = "Current password is required.")]
        public string CurrentPassword { get; set; } = null!;

        [Required(ErrorMessage = "New password is required.")]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters.")]
        public string NewPassword { get; set; } = null!;
    }

    // Salary record response
    public class SalaryRecordDTO
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Month { get; set; } = null!;
        public int Year { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = "paid";
        public DateTime? PaidDate { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // DTO for creating a new salary payment
    public class CreateSalaryRecordDTO
    {
        [Required(ErrorMessage = "User ID is required.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "Month is required.")]
        [MaxLength(20)]
        public string Month { get; set; } = null!;

        [Required(ErrorMessage = "Year is required.")]
        [Range(2020, 2100)]
        public int Year { get; set; }

        [Required(ErrorMessage = "Amount is required.")]
        [Range(0, double.MaxValue, ErrorMessage = "Amount must be a positive value.")]
        public decimal Amount { get; set; }

        [MaxLength(500)]
        public string? Notes { get; set; }
    }
}
