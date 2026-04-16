namespace Relation_IMS.Dtos
{
    public class AuditLogResponseDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string? UserRole { get; set; }
        public string Type { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public DateTime DateTime { get; set; }
        public string PrimaryKey { get; set; } = null!;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? AffectedColumns { get; set; }

        // Computed enrichment fields
        public string Category { get; set; } = "General";
        public string ActionLabel { get; set; } = "";
        public string Description { get; set; } = "";
        public string? EntityId { get; set; }
    }

    public class AuditSummaryDto
    {
        public int TotalCount { get; set; }
        public int TodayCount { get; set; }
        public double TrendPercentage { get; set; }
        public DateTime? LastEntryTime { get; set; }
    }
}
