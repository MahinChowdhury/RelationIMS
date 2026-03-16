using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopCustomersController : ControllerBase
    {
        private readonly ITopCustomerRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<TopCustomersController> _logger;

        public TopCustomersController(
            ITopCustomerRepository repository,
            IRedisCacheService cacheService,
            ILogger<TopCustomersController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<List<TopCustomer>>> GetTopCustomers(
            [FromQuery] TopCustomerPeriodType period = TopCustomerPeriodType.AllTime)
        {
            var cacheKey = $"topcustomers:{period}";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var customers = JsonSerializer.Deserialize<List<TopCustomer>>(cachedData);
                    if (customers != null)
                    {
                        _logger.LogInformation("Returning cached top customers for {Period}", period);
                        return Ok(customers);
                    }
                }

                var topCustomers = await _repository.GetTopCustomersAsync(period, 10);

                var jsonData = JsonSerializer.Serialize(topCustomers);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning top customers for {Period} from database", period);
                return Ok(topCustomers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting top customers");
                return StatusCode(500, new { message = "An error occurred while fetching top customers" });
            }
        }
    }
}
