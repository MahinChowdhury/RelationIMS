using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;
using System.Text.Json;

namespace Relation_IMS.Datas.Repositories
{
    public class AuditLogRepository : IAuditLogRepository
    {
        private readonly ApplicationDbContext _context;

        public AuditLogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        // ── Category Mapping ──────────────────────────────────────────
        private static readonly Dictionary<string, string> TableCategoryMap = new(StringComparer.OrdinalIgnoreCase)
        {
            { "Orders", "Sales" },
            { "OrderItems", "Sales" },
            { "OrderPayments", "Sales" },
            { "Products", "Products" },
            { "ProductVariants", "Products" },
            { "ProductItems", "Products" },
            { "ProductColors", "Products" },
            { "ProductSizes", "Products" },
            { "Inventories", "Inventory" },
            { "InventoryTransferRecords", "Inventory" },
            { "InventoryTransferRecordItems", "Inventory" },
            { "ProductLots", "Inventory" },
            { "ProductDefects", "Inventory" },
            { "Customers", "Customers" },
            { "CustomerReturnRecords", "Customers" },
            { "CustomerReturnItems", "Customers" },
            { "Brands", "Configuration" },
            { "Categories", "Configuration" },
            { "Quarters", "Configuration" },
            { "ShareCatalogs", "Configuration" },
            { "Users", "Security" },
            { "UserRoles", "Security" },
            { "RefreshTokens", "Security" },
            { "UserProfiles", "Security" },
            { "SalaryRecords", "Security" },
        };

        private static string GetCategory(string tableName)
        {
            return TableCategoryMap.TryGetValue(tableName, out var cat) ? cat : "General";
        }

        // ── Action Label ──────────────────────────────────────────────
        private static string GetActionLabel(string type, string tableName)
        {
            var entity = tableName switch
            {
                "Orders" => "Order",
                "OrderItems" => "Order Item",
                "OrderPayments" => "Payment",
                "Products" => "Product",
                "ProductVariants" => "Product Variant",
                "ProductItems" => "Product Item",
                "ProductColors" => "Color",
                "ProductSizes" => "Size",
                "Inventories" => "Inventory",
                "InventoryTransferRecords" => "Inventory Transfer",
                "InventoryTransferRecordItems" => "Transfer Item",
                "ProductLots" => "Product Lot",
                "ProductDefects" => "Defect Report",
                "Customers" => "Customer",
                "CustomerReturnRecords" => "Customer Return",
                "CustomerReturnItems" => "Return Item",
                "Brands" => "Brand",
                "Categories" => "Category",
                "Quarters" => "Quarter",
                "Users" => "User Account",
                "UserRoles" => "User Role",
                "UserProfiles" => "User Profile",
                "SalaryRecords" => "Salary Record",
                "ShareCatalogs" => "Share Catalog",
                _ => tableName.TrimEnd('s')
            };

            return type switch
            {
                "Create" => $"{entity} Creation",
                "Update" => $"{entity} Update",
                "Delete" => $"{entity} Deletion",
                _ => $"{entity} {type}"
            };
        }

        // ── Human-Readable Description ────────────────────────────────
        private static string GenerateDescription(string type, string tableName, string? primaryKey, string? oldValues, string? newValues, string? affectedColumns)
        {
            var entityId = ExtractEntityId(primaryKey);
            var entityLabel = tableName switch
            {
                "Orders" => $"order #{entityId}",
                "OrderItems" => $"order item #{entityId}",
                "OrderPayments" => $"payment #{entityId}",
                "Products" => $"product #{entityId}",
                "ProductVariants" => $"variant #{entityId}",
                "ProductItems" => $"product item #{entityId}",
                "Inventories" => $"inventory #{entityId}",
                "InventoryTransferRecords" => $"transfer #{entityId}",
                "Customers" => $"customer #{entityId}",
                "CustomerReturnRecords" => $"return record #{entityId}",
                "Brands" => $"brand #{entityId}",
                "Categories" => $"category #{entityId}",
                "Quarters" => $"quarter #{entityId}",
                "Users" => $"user #{entityId}",
                "ProductDefects" => $"defect report #{entityId}",
                "SalaryRecords" => $"salary record #{entityId}",
                _ => $"{tableName.TrimEnd('s').ToLower()} #{entityId}"
            };

            switch (type)
            {
                case "Create":
                    var createDetail = ExtractCreateDetail(tableName, newValues);
                    return string.IsNullOrEmpty(createDetail)
                        ? $"Created {entityLabel}."
                        : $"Created {entityLabel} — {createDetail}.";

                case "Update":
                    var changedCols = ParseChangedColumns(affectedColumns);
                    if (changedCols != null && changedCols.Count > 0)
                    {
                        var colList = changedCols.Count <= 3
                            ? string.Join(", ", changedCols)
                            : $"{string.Join(", ", changedCols.Take(3))} +{changedCols.Count - 3} more";
                        return $"Updated {entityLabel} ({colList}).";
                    }
                    return $"Updated {entityLabel}.";

                case "Delete":
                    return $"Deleted {entityLabel}.";

                default:
                    return $"{type} on {entityLabel}.";
            }
        }

        private static string? ExtractCreateDetail(string tableName, string? newValues)
        {
            if (string.IsNullOrEmpty(newValues)) return null;
            try
            {
                using var doc = JsonDocument.Parse(newValues);
                var root = doc.RootElement;
                return tableName switch
                {
                    "Orders" => root.TryGetProperty("TotalAmount", out var amt) ? $"total ৳{amt}" : null,
                    "Products" => root.TryGetProperty("Name", out var name) ? $"'{name}'" : null,
                    "Customers" => root.TryGetProperty("Name", out var cName) ? $"'{cName}'" : null,
                    "Brands" => root.TryGetProperty("Name", out var bName) ? $"'{bName}'" : null,
                    "Categories" => root.TryGetProperty("Name", out var catName) ? $"'{catName}'" : null,
                    "ProductVariants" => root.TryGetProperty("Quantity", out var qty) ? $"qty: {qty}" : null,
                    "InventoryTransferRecords" => root.TryGetProperty("TotalQuantity", out var tq) ? $"{tq} units" : null,
                    _ => null
                };
            }
            catch { return null; }
        }

        private static string? ExtractEntityId(string? primaryKey)
        {
            if (string.IsNullOrEmpty(primaryKey)) return "?";
            try
            {
                using var doc = JsonDocument.Parse(primaryKey);
                foreach (var prop in doc.RootElement.EnumerateObject())
                    return prop.Value.ToString();
            }
            catch { }
            return primaryKey;
        }

        private static List<string>? ParseChangedColumns(string? affectedColumns)
        {
            if (string.IsNullOrEmpty(affectedColumns)) return null;
            try { return JsonSerializer.Deserialize<List<string>>(affectedColumns); }
            catch { return null; }
        }

        // ── Main Query (simplified — no triple GroupJoin) ─────────────
        public async Task<(IEnumerable<AuditLogResponseDto> Logs, int TotalCount)> GetAuditLogsAsync(
            int pageNumber,
            int pageSize,
            string? search,
            string? dateFrom,
            string? dateTo,
            string? actionType,
            string? category,
            int? userId)
        {
            // Start with a simple query on AuditLogs
            var query = _context.AuditLogs.AsQueryable();

            // Search filter
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLower();
                query = query.Where(x =>
                    x.TableName.ToLower().Contains(lowerSearch) ||
                    x.PrimaryKey.ToLower().Contains(lowerSearch));
            }

            // Date range filter
            if (!string.IsNullOrEmpty(dateFrom) && DateTime.TryParse(dateFrom, out var parsedFrom))
            {
                query = query.Where(x => x.DateTime >= parsedFrom.Date);
            }
            if (!string.IsNullOrEmpty(dateTo) && DateTime.TryParse(dateTo, out var parsedTo))
            {
                query = query.Where(x => x.DateTime < parsedTo.Date.AddDays(1));
            }

            // Action type filter
            if (!string.IsNullOrEmpty(actionType))
            {
                query = query.Where(x => x.Type == actionType);
            }

            // Category filter — map category to table names and filter server-side
            if (!string.IsNullOrEmpty(category))
            {
                var tablesInCategory = TableCategoryMap
                    .Where(kv => kv.Value.Equals(category, StringComparison.OrdinalIgnoreCase))
                    .Select(kv => kv.Key)
                    .ToList();

                if (tablesInCategory.Count > 0)
                {
                    query = query.Where(x => tablesInCategory.Contains(x.TableName));
                }
            }

            // User filter
            if (userId.HasValue)
            {
                query = query.Where(x => x.UserId == userId.Value);
            }

            var totalCount = await query.CountAsync();

            // Fetch raw audit logs (simple, no joins)
            var rawLogs = await query
                .OrderByDescending(x => x.DateTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Collect unique user IDs for batch lookup
            var userIds = rawLogs
                .Where(x => x.UserId.HasValue)
                .Select(x => x.UserId!.Value)
                .Distinct()
                .ToList();

            // Batch fetch user names
            var userMap = userIds.Count > 0
                ? await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .Select(u => new { u.Id, u.Firstname, u.Lastname })
                    .ToDictionaryAsync(u => u.Id, u => (u.Firstname + " " + u.Lastname).Trim())
                : new Dictionary<int, string>();

            // Batch fetch user roles
            var roleMap = userIds.Count > 0
                ? await _context.UserRoles
                    .Where(ur => userIds.Contains(ur.UserId))
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                    .GroupBy(x => x.UserId)
                    .Select(g => new { UserId = g.Key, RoleName = g.First().Name })
                    .ToDictionaryAsync(x => x.UserId, x => x.RoleName)
                : new Dictionary<int, string>();

            // Enrich in-memory
            var logs = rawLogs.Select(x =>
            {
                var userName = x.UserId.HasValue && userMap.TryGetValue(x.UserId.Value, out var uName) ? uName : "System";
                var userRole = x.UserId.HasValue && roleMap.TryGetValue(x.UserId.Value, out var rName) ? rName : (x.UserId == null ? "System" : "User");

                return new AuditLogResponseDto
                {
                    Id = x.Id,
                    UserId = x.UserId,
                    UserName = userName,
                    UserRole = userRole,
                    Type = x.Type,
                    TableName = x.TableName,
                    DateTime = x.DateTime,
                    PrimaryKey = x.PrimaryKey,
                    OldValues = x.OldValues,
                    NewValues = x.NewValues,
                    AffectedColumns = x.AffectedColumns,
                    Category = GetCategory(x.TableName),
                    ActionLabel = GetActionLabel(x.Type, x.TableName),
                    Description = GenerateDescription(x.Type, x.TableName, x.PrimaryKey, x.OldValues, x.NewValues, x.AffectedColumns),
                    EntityId = ExtractEntityId(x.PrimaryKey)
                };
            }).ToList();

            return (logs, totalCount);
        }

        // ── Summary ───────────────────────────────────────────────────
        public async Task<AuditSummaryDto> GetAuditSummaryAsync()
        {
            var now = DateTime.UtcNow;
            var todayStart = now.Date;
            var yesterdayStart = todayStart.AddDays(-1);

            var totalCount = await _context.AuditLogs.CountAsync();
            var todayCount = await _context.AuditLogs.CountAsync(x => x.DateTime >= todayStart);
            var yesterdayCount = await _context.AuditLogs.CountAsync(x => x.DateTime >= yesterdayStart && x.DateTime < todayStart);

            var lastEntry = await _context.AuditLogs
                .OrderByDescending(x => x.DateTime)
                .Select(x => (DateTime?)x.DateTime)
                .FirstOrDefaultAsync();

            double trend = 0;
            if (yesterdayCount > 0)
                trend = Math.Round(((double)(todayCount - yesterdayCount) / yesterdayCount) * 100, 1);
            else if (todayCount > 0)
                trend = 100;

            return new AuditSummaryDto
            {
                TotalCount = totalCount,
                TodayCount = todayCount,
                TrendPercentage = trend,
                LastEntryTime = lastEntry
            };
        }
    }
}
