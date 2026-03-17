using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CustomerInsightController : ControllerBase
    {
        private readonly ICustomerInsightRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<CustomerInsightController> _logger;

        public CustomerInsightController(
            ICustomerInsightRepository repository,
            IRedisCacheService cacheService,
            ILogger<CustomerInsightController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet("alltime")]
        public async Task<ActionResult> GetAllTimeInsight()
        {
            var cacheKey = "customerinsight:alltime";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var data = JsonSerializer.Deserialize<CustomerInsightAllTimeDto>(cachedData);
                    if (data != null)
                    {
                        _logger.LogInformation("Returning cached customer insight all-time");
                        return Ok(data);
                    }
                }

                var insight = await _repository.GetAllTimeInsightAsync();

                var result = insight != null ? new CustomerInsightAllTimeDto
                {
                    NewCustomerCount = insight.NewCustomerCount,
                    ReturningCustomerCount = insight.ReturningCustomerCount,
                    TotalCustomers = insight.TotalCustomers,
                    NewCustomerPercentage = insight.NewCustomerPercentage,
                    ReturningCustomerPercentage = insight.ReturningCustomerPercentage,
                    CalculatedAt = insight.CalculatedAt
                } : new CustomerInsightAllTimeDto
                {
                    NewCustomerCount = 0,
                    ReturningCustomerCount = 0,
                    TotalCustomers = 0,
                    NewCustomerPercentage = 0,
                    ReturningCustomerPercentage = 0,
                    CalculatedAt = DateTime.UtcNow
                };

                var jsonData = JsonSerializer.Serialize(result);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning customer insight all-time from database");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer insight all-time");
                return StatusCode(500, new { message = "An error occurred while fetching customer insight" });
            }
        }

        [HttpGet("monthly")]
        public async Task<ActionResult> GetMonthlyInsight([FromQuery] int? year, [FromQuery] int? month)
        {
            var now = DateTime.UtcNow;
            var targetYear = year ?? now.Year;
            var targetMonth = month ?? now.Month;

            var cacheKey = $"customerinsight:{targetYear}:{targetMonth}";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var data = JsonSerializer.Deserialize<CustomerInsightDto>(cachedData);
                    if (data != null)
                    {
                        _logger.LogInformation("Returning cached customer insight for {Year}-{Month}", targetYear, targetMonth);
                        return Ok(data);
                    }
                }

                var insight = await _repository.GetMonthlyInsightAsync(targetYear, targetMonth);

                var result = insight != null ? new CustomerInsightDto
                {
                    Year = insight.Year,
                    Month = insight.Month,
                    NewCustomerCount = insight.NewCustomerCount,
                    ReturningCustomerCount = insight.ReturningCustomerCount,
                    TotalCustomers = insight.TotalCustomers,
                    NewCustomerPercentage = insight.NewCustomerPercentage,
                    ReturningCustomerPercentage = insight.ReturningCustomerPercentage
                } : new CustomerInsightDto
                {
                    Year = targetYear,
                    Month = targetMonth,
                    NewCustomerCount = 0,
                    ReturningCustomerCount = 0,
                    TotalCustomers = 0,
                    NewCustomerPercentage = 0,
                    ReturningCustomerPercentage = 0
                };

                var jsonData = JsonSerializer.Serialize(result);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning customer insight for {Year}-{Month} from database", targetYear, targetMonth);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting customer insight");
                return StatusCode(500, new { message = "An error occurred while fetching customer insight" });
            }
        }
    }

    public class CustomerInsightDto
    {
        public int Year { get; set; }
        public int Month { get; set; }
        public int NewCustomerCount { get; set; }
        public int ReturningCustomerCount { get; set; }
        public int TotalCustomers { get; set; }
        public decimal NewCustomerPercentage { get; set; }
        public decimal ReturningCustomerPercentage { get; set; }
    }

    public class CustomerInsightAllTimeDto
    {
        public int NewCustomerCount { get; set; }
        public int ReturningCustomerCount { get; set; }
        public int TotalCustomers { get; set; }
        public decimal NewCustomerPercentage { get; set; }
        public decimal ReturningCustomerPercentage { get; set; }
        public DateTime CalculatedAt { get; set; }
    }
}
