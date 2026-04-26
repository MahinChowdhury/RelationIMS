using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Relation_IMS.Models.AccountModels
{
    [Index(nameof(FromShopNo))]
    [Index(nameof(ToShopNo))]
    [Index(nameof(TransferDate))]
    public class CashTransfer : BaseAuditableEntity
    {
        /// <summary>
        /// The shop sending the money.
        /// </summary>
        [Required]
        public int FromShopNo { get; set; }

        /// <summary>
        /// The shop receiving the money. Always 0 (Mother Shop) in current design.
        /// </summary>
        [Required]
        public int ToShopNo { get; set; } = 0;

        /// <summary>
        /// Amount being transferred.
        /// </summary>
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        [Range(0.01, double.MaxValue)]
        public decimal Amount { get; set; }

        /// <summary>
        /// Optional note about the transfer.
        /// </summary>
        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Who initiated the transfer.
        /// </summary>
        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }

        /// <summary>
        /// Date of the transfer.
        /// </summary>
        public DateTime TransferDate { get; set; }

        /// <summary>
        /// Status of the transfer.
        /// </summary>
        public CashTransferStatus Status { get; set; } = CashTransferStatus.Completed;
    }
}
