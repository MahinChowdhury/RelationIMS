using Relation_IMS.Dtos.InventoryDtos;

namespace Relation_IMS.Dtos.InventoryDtos
{
    public class InventoryTransferHistoryDTO
    {
        public int Id { get; set; }
        public DateTime Date { get; set; }
        public string SourceInventoryName { get; set; } = string.Empty;
        public string DestinationInventoryName { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatarUrl { get; set; } // Optional, if you have it
        public List<TransferHistoryItemDTO> Items { get; set; } = new();
    }

    public class TransferHistoryItemDTO
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ProductSku { get; set; } = string.Empty; // Variant SKU or Code
        public string? ProductImageUrl { get; set; }
        public int ProductVariantId { get; set; }
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }
}
