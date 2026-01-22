
namespace Relation_IMS.Dtos.InventoryDtos
{
    public class CustomerReturnHistoryDTO
    {
        public int Id { get; set; }
        public DateTime ReturnDate { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public int ItemsCount { get; set; }
        public decimal RefundAmount { get; set; }
        public string ProcessedBy { get; set; } = string.Empty;
    }
}
