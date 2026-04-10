export interface AuditLog {
    Id: number;
    UserId: number | null;
    UserName: string | null;
    Type: 'Create' | 'Update' | 'Delete' | string;
    TableName: string;
    DateTime: string;
    PrimaryKey: string;
    OldValues: string | null;
    NewValues: string | null;
    AffectedColumns: string | null;
}

export interface AuditLogResponse {
    Records: AuditLog[];
    TotalCount: number;
    PageNumber: number;
    PageSize: number;
    TotalPages: number;
}
