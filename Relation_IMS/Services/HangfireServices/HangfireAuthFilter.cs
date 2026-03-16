using Hangfire.Dashboard;

namespace Relation_IMS.Services.HangfireServices
{
    public class HangfireAuthFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            // For simplicity, allow access in development mode
            // In production, you should implement proper authorization
            var httpContext = context.GetHttpContext();
            return httpContext?.Request.Host.Host.Contains("localhost") == true ||
                   Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        }
    }
}
