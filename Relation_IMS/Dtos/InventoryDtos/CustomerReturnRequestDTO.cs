namespace Relation_IMS.Dtos.InventoryDtos
{
    public class CustomerReturnRequestDTO
    {
        public List<string> ProductCodes { get; set; } = new List<string>();
        public int TargetInventoryId { get; set; }
        public int CustomerId { get; set; }
        public decimal RefundAmount { get; set; }
        public int? UserId { get; set; }
        public int? OrderId { get; set; }
    }
}
