using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class RevenueByCategoryController : ControllerBase
    {
        private readonly IRevenueByCategoryRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<RevenueByCategoryController> _logger;

        public RevenueByCategoryController(
            IRevenueByCategoryRepository repository,
            IRedisCacheService cacheService,
            ILogger<RevenueByCategoryController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<RevenueByCategory>>> GetRevenueByCategory(
            [FromQuery] TopSellingPeriodType period = TopSellingPeriodType.Last30Days)
        {
            var cacheKey = $"revenuebycategory:{period}";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var categories = JsonSerializer.Deserialize<List<RevenueByCategory>>(cachedData);
                    if (categories != null)
                    {
                        _logger.LogInformation("Returning cached revenue by category for {Period}", period);
                        return Ok(categories);
                    }
                }

                var revenueData = await _repository.GetRevenueByCategoriesAsync(period, 10);

                var jsonData = JsonSerializer.Serialize(revenueData);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning revenue by category for {Period} from database", period);
                return Ok(revenueData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting revenue by category");
                return StatusCode(500, new { message = "An error occurred while fetching revenue by category" });
            }
        }
    }
}
