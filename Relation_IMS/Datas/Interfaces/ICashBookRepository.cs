using Relation_IMS.Dtos.CashBookDtos;
using Relation_IMS.Models.AccountModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ICashBookRepository
    {
        /// <summary>
        /// Get paginated cashbook entries for a shop (or all shops if shopNo is null).
        /// </summary>
        Task<List<CashBookEntryResponseDTO>> GetCashBookEntriesAsync(
            int? shopNo, DateTime? startDate, DateTime? endDate,
            int pageNumber = 1, int pageSize = 20,
            string? search = null, CashBookEntryType? entryType = null);

        /// <summary>
        /// Get summary (opening balance, total in, total out, closing) for a shop in a date range.
        /// </summary>
        Task<CashBookSummaryDTO> GetCashBookSummaryAsync(int shopNo, DateTime? startDate, DateTime? endDate);

        /// <summary>
        /// Create a manual cashbook entry (manual cash in / cash out).
        /// </summary>
        Task<CashBookEntry> CreateManualEntryAsync(int shopNo, int userId, CreateManualEntryDTO dto);

        /// <summary>
        /// Auto-record a cashbook entry when an order payment is made (initial or due payment).
        /// </summary>
        Task RecordOrderPaymentEntryAsync(int shopNo, int userId, int orderId, int orderPaymentId, decimal amount, bool isDuePayment, PaymentMethod paymentMethod);

        /// <summary>
        /// Auto-record a cashbook entry when a customer refund is processed.
        /// </summary>
        Task RecordRefundEntryAsync(int shopNo, int userId, int? orderId, decimal refundAmount);

        /// <summary>
        /// Transfer money from a shop to the Mother Shop (ShopNo = 0).
        /// Creates a CashTransfer record and two CashBookEntries (TransferOut + TransferIn).
        /// </summary>
        Task<CashTransfer> TransferToMotherShopAsync(int fromShopNo, int userId, CreateCashTransferDTO dto);

        /// <summary>
        /// Get transfer history for a shop.
        /// </summary>
        Task<List<CashTransfer>> GetTransferHistoryAsync(int? shopNo, int pageNumber = 1, int pageSize = 20);

        /// <summary>
        /// Set the opening balance for a shop (Owner only).
        /// </summary>
        Task<CashBookEntry> SetOpeningBalanceAsync(int userId, SetOpeningBalanceDTO dto);

        /// <summary>
        /// Get the current (latest) running balance for a shop.
        /// </summary>
        Task<decimal> GetLatestBalanceAsync(int shopNo);

        /// <summary>
        /// Delete a manual cashbook entry and recalculate balances.
        /// </summary>
        Task DeleteEntryAsync(int id, int userId);

        /// <summary>
        /// Edit a manual cashbook entry and recalculate balances.
        /// </summary>
        Task<CashBookEntry> EditEntryAsync(int id, int userId, CreateManualEntryDTO dto);
    }
}
