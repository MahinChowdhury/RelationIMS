using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Relation_IMS.Models.JWTModels
{
    [Index(nameof(Token), Name = "IX_Token_Unique", IsUnique = true)]
    public class RefreshToken
    {
        [Key]
        public int Id { get; set; }
        // The refresh token string (should be a secure random string)
        [Required]
        public string Token { get; set; } = null!;
        // Helps invalidate refresh tokens when the associated access token is revoked or suspected compromised.
        [Required]
        public string JwtId { get; set; } = null!;
        // Token Expiration Date
        [Required]
        public DateTime Expires { get; set; }
        // Indicates if the token has been revoked
        public bool IsRevoked { get; set; } = false;
        // Date when the token was revoked
        public DateTime? RevokedAt { get; set; }
        // The user associated with the refresh token
        // Foreign key for the associated user
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        // Date when the token was created
        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        //The client associated with the refresh token
        [Required]
        public int ClientId { get; set; }
        [ForeignKey(nameof(ClientId))]
        public Client Client { get; set; } = null!;
        public string? CreatedByIp { get; set; }
    }
}
