using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.Analytics;
using Relation_IMS.Services;
using System.Text.Json;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class InventoryValueController : ControllerBase
    {
        private readonly IInventoryValueRepository _repository;
        private readonly IRedisCacheService _cacheService;
        private readonly ILogger<InventoryValueController> _logger;

        public InventoryValueController(
            IInventoryValueRepository repository,
            IRedisCacheService cacheService,
            ILogger<InventoryValueController> logger)
        {
            _repository = repository;
            _cacheService = cacheService;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<InventoryValue>> GetInventoryValue()
        {
            var cacheKey = "inventoryvalue:current";

            try
            {
                var cachedData = await _cacheService.GetCachedResponseAsync(cacheKey);
                if (!string.IsNullOrEmpty(cachedData))
                {
                    var inventoryValue = JsonSerializer.Deserialize<InventoryValue>(cachedData);
                    if (inventoryValue != null)
                    {
                        _logger.LogInformation("Returning cached inventory value");
                        return Ok(inventoryValue);
                    }
                }

                var data = await _repository.GetInventoryValueAsync();

                if (data == null)
                {
                    return Ok(new InventoryValue { TotalItems = 0, TotalValue = 0, LastMonthValue = 0 });
                }

                var jsonData = JsonSerializer.Serialize(data);
                await _cacheService.SetCacheResponseAsync(cacheKey, jsonData, TimeSpan.FromHours(1));

                _logger.LogInformation("Returning inventory value from database");
                return Ok(data);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting inventory value");
                return StatusCode(500, new { message = "An error occurred while fetching inventory value" });
            }
        }
    }
}
