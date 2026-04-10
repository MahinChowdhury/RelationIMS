namespace Relation_IMS.Dtos
{
    public class AuditLogResponseDto
    {
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string? UserName { get; set; }
        public string Type { get; set; } = null!;
        public string TableName { get; set; } = null!;
        public DateTime DateTime { get; set; }
        public string PrimaryKey { get; set; } = null!;
        public string? OldValues { get; set; }
        public string? NewValues { get; set; }
        public string? AffectedColumns { get; set; }
    }
}
