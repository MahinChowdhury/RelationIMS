namespace Relation_IMS.Dtos.CashBookDtos
{
    public class CashBookEntryResponseDTO
    {
        public int Id { get; set; }
        public string ReferenceNo { get; set; } = null!;
        public string EntryType { get; set; } = null!;
        public string TransactionType { get; set; } = null!;
        public string? Description { get; set; }
        public decimal? CashIn { get; set; }
        public decimal? CashOut { get; set; }
        public decimal RunningBalance { get; set; }
        public int? OrderId { get; set; }
        public int? OrderPaymentId { get; set; }
        public string? PaymentMethod { get; set; }
        public int? CashTransferId { get; set; }
        public string? Note { get; set; }
        public DateTime TransactionDate { get; set; }
        public DateTime CreatedAt { get; set; }
        public int ShopNo { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
    }
}
