using Hangfire;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Entities;
using Relation_IMS.Services.OtpServices;

namespace Relation_IMS.Services.HangfireServices
{
    public class PaymentReminderJob
    {
        private readonly ILogger<PaymentReminderJob> _logger;
        private readonly IOtpService _otpService;
        private readonly TenantJobRunner _tenantJobRunner;

        public PaymentReminderJob(
            ILogger<PaymentReminderJob> logger,
            IOtpService otpService,
            TenantJobRunner tenantJobRunner)
        {
            _logger = logger;
            _otpService = otpService;
            _tenantJobRunner = tenantJobRunner;
        }

        [DisableConcurrentExecution(timeoutInSeconds: 300)]
        public async Task ProcessPaymentReminders()
        {
            _logger.LogInformation("Payment Reminder Job started at {Time}", DateTime.UtcNow);

            try
            {
                await _tenantJobRunner.RunForAllTenantsAsync(async (context, tenantId) =>
                {
                    var today = DateTime.UtcNow.Date;

                    // Find orders where NextPaymentDate is today and there's still due amount
                    var ordersWithDuePayment = await context.Orders
                        .Include(o => o.Customer)
                        .Where(o => o.NextPaymentDate.HasValue &&
                                    o.NextPaymentDate.Value.Date == today &&
                                    o.NetAmount > o.PaidAmount)
                        .ToListAsync();

                    _logger.LogInformation("[Tenant {TenantId}] Found {Count} orders with payment due today", tenantId, ordersWithDuePayment.Count);

                    foreach (var order in ordersWithDuePayment)
                    {
                        if (order.Customer != null && !string.IsNullOrEmpty(order.Customer.Phone))
                        {
                            var dueAmount = order.NetAmount - order.PaidAmount;

                            await _otpService.SendPaymentReminderAsync(
                                order.Id,
                                order.Customer.Phone,
                                order.Customer.Name ?? "Unknown",
                                dueAmount);
                        }
                    }

                    _logger.LogInformation("[Tenant {TenantId}] Processed {Count} orders", tenantId, ordersWithDuePayment.Count);
                });

                _logger.LogInformation("Payment Reminder Job completed.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while processing payment reminders");
                throw;
            }
        }
    }
}
