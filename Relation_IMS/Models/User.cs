using Microsoft.EntityFrameworkCore;
using Relation_IMS.Models.JWTModels;
using Relation_IMS.Models.OrderModels;
using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;
using static Azure.Core.HttpHeader;

namespace Relation_IMS.Models
{
    [Index(nameof(Email), Name = "IX_Unique_Email", IsUnique = true)]
    [Index(nameof(PhoneNumber), Name = "IX_Unique_PhoneNumber", IsUnique = true)]
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required(ErrorMessage = "Firstname is required.")]
        [MaxLength(50, ErrorMessage = "Firstname cannot exceed 50 characters.")]
        public string Firstname { get; set; } = null!;
        [MaxLength(50, ErrorMessage = "Lastname cannot exceed 50 characters.")]
        public string? Lastname { get; set; }

        [Required(ErrorMessage = "Email is required.")]
        [EmailAddress(ErrorMessage = "Invalid Email Address.")]
        public string Email { get; set; } = null!;

        [Required(ErrorMessage = "Phone number is required.")]
        [MaxLength(20, ErrorMessage = "Phone number cannot exceed 20 characters.")]
        public string PhoneNumber { get; set; } = null!;

        public bool IsActive { get; set; } = true;
        [Required]
        [MaxLength(100)]
        public string PasswordHash { get; set; } = null!;
        // Navigation property for roles
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        // Navigation property for Refresh Tokens
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

        public List<Order>? Orders { get; set; }
        public int? ShopNo { get; set; } = 0;

        // User preferences
        [MaxLength(5)]
        public string PreferredLanguage { get; set; } = "en";

        [MaxLength(10)]
        public string PreferredTheme { get; set; } = "light";

        public Relation_IMS.Models.UserProfileModels.UserProfile? UserProfile { get; set; }
        public ICollection<Relation_IMS.Models.UserProfileModels.SalaryRecord> SalaryRecords { get; set; } = new List<Relation_IMS.Models.UserProfileModels.SalaryRecord>();
    }
}