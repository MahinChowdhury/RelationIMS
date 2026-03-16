using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopSellingProductsController : ControllerBase
    {
        private readonly ITopSellingProductRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<TopSellingProductsController> _logger;

        public TopSellingProductsController(
            ITopSellingProductRepository repository,
            IRedisCacheService cacheService,
            ILogger<TopSellingProductsController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<TopSellingProduct>>> GetTopSellingProducts(
            [FromQuery] TopSellingPeriodType period = TopSellingPeriodType.Last30Days,
            [FromQuery] int count = 20)
        {
            var cacheKey = $"topselling:{period}:{count}";

            try
            {
                // Try to get from cache
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var products = JsonSerializer.Deserialize<List<TopSellingProduct>>(cachedData);
                    if (products != null)
                    {
                        _logger.LogInformation("Returning cached top selling products for {Period}", period);
                        return Ok(products);
                    }
                }

                // Get from database
                var topProducts = await _repository.GetTopSellingProductsAsync(period, count);

                // Calculate percentages for display
                var maxQuantity = topProducts.Any() ? topProducts.Max(p => p.TotalQuantitySold) : 0;
                if (maxQuantity > 0)
                {
                    foreach (var product in topProducts)
                    {
                        product.TotalRevenue = (product.TotalQuantitySold * 100) / maxQuantity; // Use TotalRevenue field to store percentage temporarily
                    }
                }

                // Cache the result for 1 hour (since it's updated daily at midnight)
                var jsonData = JsonSerializer.Serialize(topProducts);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning top selling products for {Period} from database", period);
                return Ok(topProducts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top selling products");
                return StatusCode(500, new { message = "An error occurred while fetching top selling products" });
            }
        }
    }
}
