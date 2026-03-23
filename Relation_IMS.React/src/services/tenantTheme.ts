// Tenant theme configuration and application

export interface TenantConfig {
    identifier: string;
    displayName: string;
    subtitle: string;
    fullName: string;
}

export const TENANT_CONFIGS: Record<string, TenantConfig> = {
    RelationIms: {
        identifier: 'RelationIms',
        displayName: 'Relation IMS',
        subtitle: 'Inventory Manager',
        fullName: 'Relation Inventory Management System',
    },
    YoloIms: {
        identifier: 'YoloIms',
        displayName: 'Yolo IMS',
        subtitle: 'Inventory Manager',
        fullName: 'Yolo Inventory Management System',
    },
};

/**
 * Apply tenant theme by setting the data-tenant attribute on <html>.
 * CSS variables in index.css switch colors based on this attribute.
 * Also updates the document title.
 */
export function applyTenantTheme(tenantId: string | null): void {
    const id = tenantId || 'RelationIms';
    const config = TENANT_CONFIGS[id] || TENANT_CONFIGS.RelationIms;

    document.documentElement.setAttribute('data-tenant', id);
    document.title = config.displayName;
}

/**
 * Get the current tenant config based on stored tenant.
 */
export function getTenantConfig(tenantId: string | null): TenantConfig {
    const id = tenantId || 'RelationIms';
    return TENANT_CONFIGS[id] || TENANT_CONFIGS.RelationIms;
}
