using Relation_IMS.Dtos;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IAuditLogRepository
    {
        Task<(IEnumerable<AuditLogResponseDto> Logs, int TotalCount)> GetAuditLogsAsync(
            int pageNumber,
            int pageSize,
            string? search,
            string? dateFrom,
            string? dateTo,
            string? actionType,
            string? category,
            int? userId
        );

        Task<AuditSummaryDto> GetAuditSummaryAsync();
    }
}
