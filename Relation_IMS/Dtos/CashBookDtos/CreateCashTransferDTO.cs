using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CashBookDtos
{
    public class CreateCashTransferDTO
    {
        /// <summary>
        /// Amount to transfer to Mother Shop.
        /// </summary>
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Transfer amount must be greater than zero.")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Optional note about the transfer.
        /// </summary>
        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Transaction date. Defaults to today if not specified.
        /// </summary>
        public DateTime? TransactionDate { get; set; }
    }
}
