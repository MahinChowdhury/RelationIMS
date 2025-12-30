
export interface TransferProductItemsDTO {
    ProductItemCode: string[];
    SourceInventoryId: number;
    DestinationInventoryId: number;
    UserId: number;
}

export interface InventoryBasicDTO {
    Id: number;
    Name: string;
    Description?: string;
}

export interface TransferItemDetail {
    Code: string;
    SourceInventoryId: number;
    SourceInventory?: InventoryBasicDTO;
    DestinationInventoryId: number;
    DestinationInventory?: InventoryBasicDTO;
}

export interface TransferResultDTO {
    Success: boolean;
    Message: string;
    TransferredCount: number;
    InvalidCodes?: string[];
    TransferDetails?: TransferItemDetail[];
}
