namespace Relation_IMS.Services.OtpServices
{
    public class OtpService : IOtpService
    {
        private readonly ILogger<OtpService> _logger;

        public OtpService(ILogger<OtpService> logger)
        {
            _logger = logger;
        }

        public Task SendPaymentReminderAsync(int orderId, string phoneNumber, string customerName, decimal dueAmount)
        {
            // For testing: just console.log the order details
            Console.WriteLine($"[PaymentReminder] Order #{orderId} - Phone: {phoneNumber}, Customer: {customerName}, Due Amount: {dueAmount:C}");

            _logger.LogInformation(
                "Payment reminder triggered for Order {OrderId}. Phone: {PhoneNumber}, Customer: {CustomerName}, Due Amount: {DueAmount}",
                orderId, phoneNumber, customerName, dueAmount);

            // TODO: Implement actual SMS/OTP service integration here
            // e.g., using Twilio, Banglalion, or other SMS provider

            return Task.CompletedTask;
        }
    }
}
