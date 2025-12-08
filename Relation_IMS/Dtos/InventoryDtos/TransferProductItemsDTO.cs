using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.InventoryDtos
{
    public class TransferProductItemsDTO
    {
        [Required(ErrorMessage = "Source inventory ID is required.")]
        public int SourceInventoryId { get; set; }

        [Required(ErrorMessage = "Destination inventory ID is required.")]
        public int DestinationInventoryId { get; set; }

        [Required(ErrorMessage = "Product variant ID is required.")]
        public int ProductVariantId { get; set; }

        [Required(ErrorMessage = "Quantity is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Quantity must be at least 1.")]
        public int Quantity { get; set; }
    }
}
