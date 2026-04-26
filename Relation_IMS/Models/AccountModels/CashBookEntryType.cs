namespace Relation_IMS.Models.AccountModels
{
    public enum CashBookEntryType
    {
        OrderPayment,       // Auto: customer paid for an order
        DuePayment,         // Auto: customer paid dues on an old order
        Refund,             // Auto: customer return/refund
        TransferOut,        // Shop sending money to Mother Shop
        TransferIn,         // Mother Shop receiving money from a shop
        ManualCashIn,       // Manual entry: any other income
        ManualCashOut,      // Manual entry: expense, petty cash, etc.
        OpeningBalance      // Initial balance entry
    }
}
