export interface StockItem {
    id?: number;
    color: string;
    size: string;
    quantity: number;
}

export interface ProductColor {
    Id: number;
    Name: string;
    HexCode: string;
}

export interface ProductSize {
    Id: number;
    Name: string;
    CategoryId: number;
}

export interface ProductVariant {
    Id: number;
    ProductId: number;
    ProductColorId: number;
    Color?: ProductColor;
    ProductSizeId: number;
    Size?: ProductSize;
    VariantPrice: number;
    CostPrice: number;
    MSRP: number;
    Quantity: number;
    Defects: number;
    ProductItems?: any[];
}

export interface Product {
    Id: number;
    Name: string;
    Description: string;
    BasePrice: number;
    CostPrice: number;
    MSRP: number;
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
    Variants?: ProductVariant[];
}
// --- Customers ---
export const PaymentStatus = {
    Pending: 0,
    Partial: 1,
    Paid: 2,
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface OrderPayment {
    Id: number;
    OrderId: number;
    PaymentMethod: PaymentMethodType;
    Amount: number;
    Note?: string;
}

export const PaymentMethodType = {
    Cash: 0,
    Bank: 1,
    Bkash: 2
} as const;

export type PaymentMethodType = typeof PaymentMethodType[keyof typeof PaymentMethodType];

export interface OrderItem {
    Id: number;
    OrderId: number;
    ProductId: number;
    Product?: Product;
    Quantity: number;
    UnitPrice: number;
    CostPrice?: number;
    Discount?: number;
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
    PaidAmount: number;
    PaymentStatus: PaymentStatus;
    UserId: number;
    User?: any;
    Remarks?: string;
    Payments?: OrderPayment[];
    CreatedAt: string;
    NextPaymentDate?: string; // or Date if transformed
    date?: string;
}

export interface Customer {
    Id: number;
    Name: string;
    Phone: string;
    Address: string;
    ShopName: string;
    ShopAddress: string;
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

export interface Inventory {
    Id: number;
    Name: string;
    Description?: string;
    ProductItems?: any[];
}
export interface ScannedItem {
    id: string; // unique scan id
    code: string;
    description?: string; // placeholder for product name/desc if we can fetch it, otherwise just code
    count: number;
    scannedAt: Date;
    isValid?: boolean; // New field for validation status
    imageUrl?: string | null;
}

export * from './transfer';
