using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly ApplicationDbContext _context;

        public AuditLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<(IEnumerable<AuditLogResponseDto> Logs, int TotalCount)> GetAuditLogsAsync(
            int pageNumber,
            int pageSize,
            string? search,
            string? date,
            string? actionType,
            int? userId)
        {
            var query = _context.AuditLogs
                .GroupJoin(
                    _context.Users,
                    audit => audit.UserId,
                    user => user.Id,
                    (audit, users) => new { audit, user = users.FirstOrDefault() }
                )
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(x => 
                    x.audit.TableName.ToLower().Contains(lowerSearch) || 
                    x.audit.PrimaryKey.ToLower().Contains(lowerSearch));
            }

            if (!string.IsNullOrEmpty(date) && DateTime.TryParse(date, out var parsedDate))
            {
                query = query.Where(x => x.audit.DateTime.Date == parsedDate.Date);
            }

            if (!string.IsNullOrEmpty(actionType))
            {
                query = query.Where(x => x.audit.Type == actionType);
            }

            if (userId.HasValue)
            {
                query = query.Where(x => x.audit.UserId == userId.Value);
            }

            var totalCount = await query.CountAsync();

            var logs = await query
                .OrderByDescending(x => x.audit.DateTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new AuditLogResponseDto
                {
                    Id = x.audit.Id,
                    UserId = x.audit.UserId,
                    UserName = x.user != null ? x.user.Firstname + " " + x.user.Lastname : "System",
                    Type = x.audit.Type,
                    TableName = x.audit.TableName,
                    DateTime = x.audit.DateTime,
                    PrimaryKey = x.audit.PrimaryKey,
                    OldValues = x.audit.OldValues,
                    NewValues = x.audit.NewValues,
                    AffectedColumns = x.audit.AffectedColumns
                })
                .ToListAsync();

            return (logs, totalCount);
        }
    }
}
