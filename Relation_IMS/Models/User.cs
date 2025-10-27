using Microsoft.EntityFrameworkCore;
using Relation_IMS.Models.JWTModels;
using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;
using static Azure.Core.HttpHeader;

namespace Relation_IMS.Models
{
    [Index(nameof(Email), Name = "IX_Unique_Email", IsUnique = true)]
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
        public bool IsActive { get; set; } = true;
        [Required]
        [MaxLength(100)]
        public string PasswordHash { get; set; } = null!;
        // Navigation property for roles
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
        // Navigation property for Refresh Tokens
        public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    }
}
