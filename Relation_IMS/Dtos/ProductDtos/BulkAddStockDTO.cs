using System.ComponentModel.DataAnnotations;

namespace Relation_IMS.Dtos.ProductDtos
{
    public class BulkAddStockItemDTO
    {
        [Required]
        public int VariantId { get; set; }
        [Required]
        [Range(1, int.MaxValue)]
        public int Quantity { get; set; }
        [Required]
        public int InventoryId { get; set; }
    }

    public class BulkAddStockDTO
    {
        public int? LotId { get; set; }
        [Required]
        public List<BulkAddStockItemDTO> Items { get; set; } = new List<BulkAddStockItemDTO>();
    }
}
