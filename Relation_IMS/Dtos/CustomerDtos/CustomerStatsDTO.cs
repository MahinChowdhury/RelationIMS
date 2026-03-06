namespace Relation_IMS.Dtos.CustomerDtos
{
    public class CustomerStatsDTO
    {
        public decimal TotalPurchases { get; set; }
        public decimal TotalDue { get; set; }
        public DateTime? LastOrderDate { get; set; }
    }
}
