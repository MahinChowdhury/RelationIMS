using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesOverviewController : ControllerBase
    {
        private readonly ISalesOverviewRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<SalesOverviewController> _logger;

        public SalesOverviewController(
            ISalesOverviewRepository repository,
            IRedisCacheService cacheService,
            ILogger<SalesOverviewController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<SalesOverview>> GetSalesOverview(
            [FromQuery] SalesOverviewPeriodType period = SalesOverviewPeriodType.ThisWeek)
        {
            var cacheKey = $"salesoverview:{period}";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var salesOverview = JsonSerializer.Deserialize<SalesOverview>(cachedData);
                    if (salesOverview != null)
                    {
                        _logger.LogInformation("Returning cached sales overview for {Period}", period);
                        return Ok(salesOverview);
                    }
                }

                var salesData = await _repository.GetSalesOverviewAsync(period);

                if (salesData == null)
                {
                    return Ok(new SalesOverview { PeriodType = period, TotalRevenue = 0, OrderCount = 0 });
                }

                var jsonData = JsonSerializer.Serialize(salesData);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning sales overview for {Period} from database", period);
                return Ok(salesData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sales overview");
                return StatusCode(500, new { message = "An error occurred while fetching sales overview" });
            }
        }

        [HttpGet("all")]
        public async Task<ActionResult<List<SalesOverview>>> GetAllSalesOverview()
        {
            var cacheKey = "salesoverview:all";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var salesOverview = JsonSerializer.Deserialize<List<SalesOverview>>(cachedData);
                    if (salesOverview != null)
                    {
                        _logger.LogInformation("Returning cached all sales overview");
                        return Ok(salesOverview);
                    }
                }

                var thisWeek = await _repository.GetSalesOverviewAsync(SalesOverviewPeriodType.ThisWeek);
                var thisMonth = await _repository.GetSalesOverviewAsync(SalesOverviewPeriodType.ThisMonth);

                var result = new List<SalesOverview>();
                if (thisWeek != null) result.Add(thisWeek);
                if (thisMonth != null) result.Add(thisMonth);

                var jsonData = JsonSerializer.Serialize(result);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all sales overview");
                return StatusCode(500, new { message = "An error occurred while fetching sales overview" });
            }
        }
    }
}
