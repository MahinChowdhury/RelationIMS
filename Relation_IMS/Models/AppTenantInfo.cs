using Finbuckle.MultiTenant.Abstractions;

namespace Relation_IMS.Models;

/// <summary>
/// Tenant information for Finbuckle.MultiTenant.
/// Each tenant has its own PostgreSQL database.
/// </summary>
public class AppTenantInfo : ITenantInfo
{
    public string? Id { get; set; }
    public string? Identifier { get; set; }
    public string? Name { get; set; }
    public string? ConnectionString { get; set; }
}
