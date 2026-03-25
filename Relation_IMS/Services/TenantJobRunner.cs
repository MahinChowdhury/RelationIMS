using Finbuckle.MultiTenant;
using Finbuckle.MultiTenant.Abstractions;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Entities;
using Relation_IMS.Models;

namespace Relation_IMS.Services;

/// <summary>
/// Runs a given action for every configured tenant.
/// Used by Hangfire jobs to execute per-tenant logic with the correct DbContext.
/// </summary>
public class TenantJobRunner
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TenantJobRunner> _logger;

    public TenantJobRunner(IServiceScopeFactory scopeFactory, ILogger<TenantJobRunner> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// Iterates over all tenants and runs the given async action with a properly scoped DbContext for each.
    /// </summary>
    public async Task RunForAllTenantsAsync(Func<ApplicationDbContext, string, Task> action)
    {
        // Get all tenants from the store
        using var outerScope = _scopeFactory.CreateScope();
        var tenantStore = outerScope.ServiceProvider.GetRequiredService<IMultiTenantStore<AppTenantInfo>>();
        var tenants = await tenantStore.GetAllAsync();

        foreach (var tenant in tenants)
        {
            try
            {
                _logger.LogInformation("Running job for tenant: {TenantId} ({TenantName})", tenant.Identifier, tenant.Name);

                // Create a new scope for each tenant so we get a fresh DbContext
                using var tenantScope = _scopeFactory.CreateScope();

                // Set up the multi-tenant context for this scope
                var tenantContextAccessor = tenantScope.ServiceProvider.GetRequiredService<IMultiTenantContextAccessor<AppTenantInfo>>();
                var multiTenantContext = new MultiTenantContext<AppTenantInfo> { TenantInfo = tenant };
                ((IMultiTenantContextSetter)tenantContextAccessor).MultiTenantContext = multiTenantContext;

                var context = tenantScope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

                await action(context, tenant.Identifier ?? "unknown");

                _logger.LogInformation("Job completed for tenant: {TenantId}", tenant.Identifier);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Job failed for tenant: {TenantId}", tenant.Identifier);
                // Continue with next tenant, don't let one failure stop all
            }
        }
    }
}
