export interface AuditLog {
    Id: number;
    UserId: number | null;
    UserName: string | null;
    UserRole: string | null;
    Type: 'Create' | 'Update' | 'Delete' | string;
    TableName: string;
    DateTime: string;
    PrimaryKey: string;
    OldValues: string | null;
    NewValues: string | null;
    AffectedColumns: string | null;
    Category: string;
    ActionLabel: string;
    Description: string;
    EntityId: string | null;
}

export interface AuditLogResponse {
    Records: AuditLog[];
    TotalCount: number;
    PageNumber: number;
    PageSize: number;
    TotalPages: number;
}

export interface AuditSummary {
    TotalCount: number;
    TodayCount: number;
    TrendPercentage: number;
    LastEntryTime: string | null;
}
