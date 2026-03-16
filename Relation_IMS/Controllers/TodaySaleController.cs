using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodaySaleController : ControllerBase
    {
        private readonly ITodaySaleRepository _repository;
        private readonly ILogger<TodaySaleController> _logger;

        public TodaySaleController(
            ITodaySaleRepository repository,
            ILogger<TodaySaleController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult> GetTodaySale()
        {
            var today = DateTime.UtcNow;
            var yesterday = today.AddDays(-1);

            try
            {
                var todaySale = await _repository.GetTodaySaleAsync(today);
                var yesterdaySale = await _repository.GetYesterdaySaleAsync(yesterday);

                var result = new TodaySaleDto
                {
                    Date = today.Date,
                    TotalSales = todaySale?.TotalSales ?? 0,
                    OrderCount = todaySale?.OrderCount ?? 0,
                    YesterdaySales = yesterdaySale?.TotalSales ?? 0,
                    PercentageChange = yesterdaySale != null && yesterdaySale.TotalSales > 0
                        ? Math.Round((decimal)((todaySale?.TotalSales ?? 0) - yesterdaySale.TotalSales) / yesterdaySale.TotalSales * 100, 1)
                        : 0
                };

                _logger.LogInformation("Returning today's sale for {Date} from database", today.Date);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting today's sale");
                return StatusCode(500, new { message = "An error occurred while fetching today's sale" });
            }
        }
    }

    public class TodaySaleDto
    {
        public DateTime Date { get; set; }
        public decimal TotalSales { get; set; }
        public int OrderCount { get; set; }
        public decimal YesterdaySales { get; set; }
        public decimal PercentageChange { get; set; }
    }
}
