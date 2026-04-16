using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;

namespace Relation_IMS.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(Roles = "Owner,Head Manager")]
    public class AuditLogController : ControllerBase
    {
        private readonly IAuditLogRepository _auditLogRepo;

        public AuditLogController(IAuditLogRepository auditLogRepo)
        {
            _auditLogRepo = auditLogRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAuditLogs(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] string? dateFrom = null,
            [FromQuery] string? dateTo = null,
            [FromQuery] string? actionType = null,
            [FromQuery] string? category = null,
            [FromQuery] int? userId = null)
        {
            var (logs, totalCount) = await _auditLogRepo.GetAuditLogsAsync(
                pageNumber, pageSize, search, dateFrom, dateTo, actionType, category, userId);

            return Ok(new
            {
                Records = logs,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var summary = await _auditLogRepo.GetAuditSummaryAsync();
            return Ok(summary);
        }
    }
}
