export interface StockItem {
    id?: number;
    color: string;
    size: string;
    quantity: number;
}

export interface Product {
    Id: number;
    Name: string;
    Description: string;
    BasePrice: number;
    CategoryId: number; // API refs suggest numbers but safe to handle strings
    BrandId: number;
    ImageUrls?: string[];
    TotalQuantity?: number;
    Category?: {
        Id: number;
        Name: string;
    };
    Brand?: {
        Id: number;
        Name: string;
    };
}
// --- Customers ---
export const PaymentStatus = {
    Pending: 0,
    Partial: 1,
    Paid: 2,
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface OrderItem {
    Id: number;
    OrderId: number;
    ProductId: number;
    Product?: Product;
    Quantity: number;
    UnitPrice: number;
    Subtotal: number;
}

export interface Order {
    Id: number;
    CustomerId: number;
    Customer?: Customer;
    OrderItems?: OrderItem[];
    TotalAmount: number;
    Discount: number;
    NetAmount: number;
    PaymentStatus: PaymentStatus;
    UserId: number;
    User?: any;
    Remarks?: string;
    CreatedAt: string;
    date?: string;
}

export interface Customer {
    Id: number;
    Name: string;
    Phone: string;
    Email?: string;
    Address: string;
    Orders?: Order[];
    CreatedDate?: string;
}

export interface InventoryStock {
    InventoryId: number;
    Inventory: {
        Id: number;
        Name: string;
        Description: string;
        ProductItems: any[];
    };
    Quantity: number;
}
export interface ScannedItem {
    id: string; // unique scan id
    code: string;
    description?: string; // placeholder for product name/desc if we can fetch it, otherwise just code
    count: number;
    scannedAt: Date;
    isValid?: boolean; // New field for validation status
}

export * from './transfer';
