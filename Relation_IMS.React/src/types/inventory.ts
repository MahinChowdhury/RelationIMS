export interface DefectItem {
    Id: number;
    ProductItemId: number;
    Code: string;
    ProductName: string;
    Reason: string;
    Status: string;
    ReportedBy: string;
    DefectDate: string;
    ProductImageUrl?: string;
}

export interface DefectItemResponse {
    items: DefectItem[];
    totalCount: number;
}

export interface MovementLog {
    Id: number;
    Date: string; // ISO string
    ProductName: string;
    ProductSku: string;
    ProductImage: string;
    SourceLocation: string;
    DestinationLocation: string;
    Quantity: number;
    User: string;
    UserAvatar: string;
    ActionType: 'Transfer' | 'StockIn' | 'StockOut' | 'Audit';
}

export interface TransferHistoryItem {
    ProductId: number;
    ProductName: string;
    ProductSku: string;
    ProductImageUrl?: string;
    ProductVariantId: number;
    ColorName: string;
    SizeName: string;
    Quantity: number;
}

export interface InventoryTransferHistoryResponse {
    Id: number;
    Date: string;
    SourceInventoryName: string;
    DestinationInventoryName: string;
    UserName: string;
    UserAvatarUrl?: string;
    Items: TransferHistoryItem[];
}
