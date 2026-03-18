namespace Relation_IMS.Services.OtpServices
{
    public interface IOtpService
    {
        Task SendPaymentReminderAsync(int orderId, string phoneNumber, string customerName, decimal dueAmount);
    }
}
