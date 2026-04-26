namespace Relation_IMS.Dtos.CashBookDtos
{
    public class CashBookSummaryDTO
    {
        public decimal OpeningBalance { get; set; }
        public decimal TotalCashIn { get; set; }
        public decimal TotalCashOut { get; set; }
        public decimal ClosingBalance { get; set; }
        public int EntryCount { get; set; }
        public string? PeriodLabel { get; set; }
    }
}
