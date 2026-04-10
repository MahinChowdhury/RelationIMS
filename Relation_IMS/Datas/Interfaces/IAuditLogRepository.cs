using Relation_IMS.Dtos;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IAuditLogRepository
    {
        Task<(IEnumerable<AuditLogResponseDto> Logs, int TotalCount)> GetAuditLogsAsync(
            int pageNumber,
            int pageSize,
            string? search,
            string? date,
            string? actionType,
            int? userId
        );
    }
}
