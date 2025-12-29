using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.InventoryDtos
{
    // Request DTO for transferring product items - with source and destination
    public class TransferProductItemsDTO
    {
        [Required(ErrorMessage = "Product item code is required.")]
        public List<string> ProductItemCode { get; set; } = new();

        [Required(ErrorMessage = "Source inventory ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Source inventory ID must be greater than 0.")]
        public int SourceInventoryId { get; set; }

        [Required(ErrorMessage = "Destination inventory ID is required.")]
        [Range(1, int.MaxValue, ErrorMessage = "Destination inventory ID must be greater than 0.")]
        public int DestinationInventoryId { get; set; }

        [Required(ErrorMessage = "User ID is required.")]
        public int UserId { get; set; }
    }

    // Transfer result DTO with inventory details
    public class TransferResultDTO
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public int TransferredCount { get; set; }
        public List<string>? InvalidCodes { get; set; }
        public List<TransferItemDetail>? TransferDetails { get; set; }
    }

    // Detailed transfer item info including inventory objects
    public class TransferItemDetail
    {
        public string Code { get; set; } = string.Empty;
        public int SourceInventoryId { get; set; }
        public InventoryBasicDTO? SourceInventory { get; set; }
        public int DestinationInventoryId { get; set; }
        public InventoryBasicDTO? DestinationInventory { get; set; }
    }

    // Basic inventory info for transfer details
    public class InventoryBasicDTO
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}