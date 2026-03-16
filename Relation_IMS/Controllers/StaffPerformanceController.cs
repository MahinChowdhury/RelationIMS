using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StaffPerformanceController : ControllerBase
    {
        private readonly IStaffPerformanceRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<StaffPerformanceController> _logger;

        public StaffPerformanceController(
            IStaffPerformanceRepository repository,
            IRedisCacheService cacheService,
            ILogger<StaffPerformanceController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet("monthly")]
        public async Task<ActionResult> GetMonthlyPerformance([FromQuery] int? year, [FromQuery] int? month)
        {
            var now = DateTime.UtcNow;
            var targetYear = year ?? now.Year;
            var targetMonth = month ?? now.Month;

            var cacheKey = $"staffperformance:{targetYear}:{targetMonth}";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var data = JsonSerializer.Deserialize<List<StaffPerformanceDto>>(cachedData);
                    if (data != null)
                    {
                        _logger.LogInformation("Returning cached staff performance for {Year}-{Month}", targetYear, targetMonth);
                        return Ok(data);
                    }
                }

                var performanceData = await _repository.GetMonthlyPerformanceAsync(targetYear, targetMonth);

                var result = performanceData.Select(p => new StaffPerformanceDto
                {
                    UserId = p.UserId,
                    FullName = p.User != null ? $"{p.User.Firstname} {p.User.Lastname}".Trim() : "Unknown",
                    Year = p.Year,
                    Month = p.Month,
                    TotalSales = p.TotalSales,
                    OrderCount = p.OrderCount,
                    Rank = p.Rank
                }).ToList();

                var jsonData = JsonSerializer.Serialize(result);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning staff performance for {Year}-{Month} from database", targetYear, targetMonth);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting staff performance");
                return StatusCode(500, new { message = "An error occurred while fetching staff performance" });
            }
        }
    }

    public class StaffPerformanceDto
    {
        public int UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int Year { get; set; }
        public int Month { get; set; }
        public decimal TotalSales { get; set; }
        public int OrderCount { get; set; }
        public int Rank { get; set; }
    }
}
