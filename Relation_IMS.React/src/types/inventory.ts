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
