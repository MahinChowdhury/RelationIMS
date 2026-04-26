using Relation_IMS.Models.PaymentModels;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace Relation_IMS.Models.AccountModels
{
    [Index(nameof(ShopNo))]
    [Index(nameof(TransactionDate))]
    [Index(nameof(EntryType))]
    [Index(nameof(ReferenceNo), IsUnique = true)]
    public class CashBookEntry : BaseAuditableEntity
    {
        /// <summary>
        /// Which shop this entry belongs to (maps to User.ShopNo / Inventory).
        /// ShopNo = 0 is the Mother Shop (Owner).
        /// </summary>
        [Required]
        public int ShopNo { get; set; }

        /// <summary>
        /// Unique human-readable reference (e.g., "CB-001-20260426-0001").
        /// </summary>
        [Required]
        [MaxLength(50)]
        public string ReferenceNo { get; set; } = null!;

        /// <summary>
        /// System entry type (OrderPayment, DuePayment, Refund, TransferOut, ManualCashIn, etc.).
        /// </summary>
        [Required]
        public CashBookEntryType EntryType { get; set; }

        /// <summary>
        /// Free-text transaction type typed by user (e.g., "Labour Cost", "Tea / Coffee", "Guest Hospitality").
        /// For auto-generated entries: "Order Payment", "Due Collection", "Customer Refund", "Transfer to HQ", etc.
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string TransactionType { get; set; } = null!;

        /// <summary>
        /// Free-text description for details.
        /// </summary>
        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// Money coming in (null/0 if this is cash-out).
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? CashIn { get; set; }

        /// <summary>
        /// Money going out (null/0 if this is cash-in).
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal? CashOut { get; set; }

        /// <summary>
        /// Running balance AFTER this entry for this shop.
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal RunningBalance { get; set; }

        /// <summary>
        /// Link to OrderPayment if this was auto-generated from an order payment or due collection.
        /// </summary>
        public int? OrderPaymentId { get; set; }
        public OrderPayment? OrderPayment { get; set; }

        /// <summary>
        /// Link to the Order (for quick reference in display).
        /// </summary>
        public int? OrderId { get; set; }

        /// <summary>
        /// Link to CashTransfer if this was a shop-to-mother transfer.
        /// </summary>
        public int? CashTransferId { get; set; }
        public CashTransfer? CashTransfer { get; set; }

        /// <summary>
        /// Who recorded this entry.
        /// </summary>
        [Required]
        public int UserId { get; set; }
        public User? User { get; set; }

        /// <summary>
        /// Optional note.
        /// </summary>
        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// The date of the transaction (can differ from CreatedAt for backdated entries).
        /// </summary>
        public DateTime TransactionDate { get; set; }
    }
}
