using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Xml.Linq;
using static Azure.Core.HttpHeader;

namespace Relation_IMS.Models.JWTModels
{
    [Index(nameof(ClientId), Name = "IX_Unique_ClientId", IsUnique = true)]
    public class Client
    {
        [Key]
        public int Id { get; set; }
        // Unique identifier for the client application.
        [Required(ErrorMessage = "Client Identifier is required.")]
        [MaxLength(50)]
        public string ClientId { get; set; } = null!;
        // Name of the client application.
        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = null!;
        [Required(ErrorMessage = "Client Secret is required.")]
        [MaxLength(100)]
        public string ClientSecret { get; set; } = null!;
        // URL for the client application.
        [Required]
        [MaxLength(200)]
        public string ClientURL { get; set; } = null!;
        [Required]
        public bool IsActive { get; set; } = true;
    }
}
