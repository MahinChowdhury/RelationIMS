using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.CashBookDtos
{
    public class SetOpeningBalanceDTO
    {
        /// <summary>
        /// The shop to set the opening balance for.
        /// </summary>
        [Required]
        public int ShopNo { get; set; }

        /// <summary>
        /// The opening balance amount.
        /// </summary>
        [Required]
        [Range(0, double.MaxValue)]
        public decimal Amount { get; set; }
    }
}
