using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Relation_IMS.Services;

namespace Relation_IMS.Filters
{
    /// <summary>
    /// Action filter that invalidates Redis cache entries by prefix after a successful mutation.
    /// Usage: [InvalidateCache("category", "product")] on POST/PUT/DELETE endpoints.
    /// Deletes all Redis keys matching each prefix pattern (e.g., "category:*").
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class InvalidateCacheAttribute : Attribute, IAsyncActionFilter
    {
        private readonly string[] _prefixes;

        public InvalidateCacheAttribute(params string[] prefixes)
        {
            _prefixes = prefixes;
        }

        public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
        {
            // Execute the action first
            var executedContext = await next();

            // Only invalidate if the action succeeded (no exception AND 2xx status code)
            if (executedContext.Exception != null)
                return;

            // Check for a successful status code (2xx)
            var statusCode = (executedContext.Result as ObjectResult)?.StatusCode
                          ?? (executedContext.Result as StatusCodeResult)?.StatusCode;

            if (statusCode == null || statusCode < 200 || statusCode >= 300)
                return;

            try
            {
                var cacheService = context.HttpContext.RequestServices.GetRequiredService<IRedisCacheService>();

                foreach (var prefix in _prefixes)
                {
                    await cacheService.InvalidateCacheByPrefixAsync(prefix);
                }
            }
            catch (Exception ex)
            {
                // Log the error but do NOT let Redis failures propagate and corrupt the HTTP response
                var logger = context.HttpContext.RequestServices.GetService<ILoggerFactory>()
                    ?.CreateLogger<InvalidateCacheAttribute>();
                logger?.LogError(ex, "Failed to invalidate cache for prefixes: {Prefixes}", string.Join(", ", _prefixes));
            }
        }
    }
}
