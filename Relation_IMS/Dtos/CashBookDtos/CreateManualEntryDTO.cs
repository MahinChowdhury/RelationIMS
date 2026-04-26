using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CashBookDtos
{
    public class CreateManualEntryDTO
    {
        /// <summary>
        /// Free-text transaction type (e.g., "Labour Cost", "Tea / Coffee", "Guest Hospitality").
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
        /// Amount coming in. Provide either CashIn or CashOut, not both.
        /// </summary>
        [Range(0, double.MaxValue)]
        public decimal? CashIn { get; set; }

        /// <summary>
        /// Amount going out. Provide either CashIn or CashOut, not both.
        /// </summary>
        [Range(0, double.MaxValue)]
        public decimal? CashOut { get; set; }

        /// <summary>
        /// Optional note.
        /// </summary>
        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Transaction date. Defaults to today if not specified.
        /// </summary>
        public DateTime? TransactionDate { get; set; }
    }
}
