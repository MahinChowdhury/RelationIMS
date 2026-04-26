import api from './api';
import type { AxiosRequestConfig } from 'axios';

// ──────────────────────────── Types ────────────────────────────

export interface CashBookEntryResponse {
    Id: number;
    ReferenceNo: string;
    EntryType: string;
    TransactionType: string;
    Description: string | null;
    CashIn: number | null;
    CashOut: number | null;
    RunningBalance: number;
    OrderId: number | null;
    CashTransferId: number | null;
    Note: string | null;
    TransactionDate: string;
    CreatedAt: string;
    ShopNo: number;
    UserId: number;
    UserName: string | null;
}

export interface CashBookSummary {
    OpeningBalance: number;
    TotalCashIn: number;
    TotalCashOut: number;
    ClosingBalance: number;
    EntryCount: number;
    PeriodLabel: string | null;
}

export interface CreateManualEntryDTO {
    TransactionType: string;
    Description?: string;
    CashIn?: number | null;
    CashOut?: number | null;
    Note?: string;
    TransactionDate?: string;
}

export interface CreateCashTransferDTO {
    Amount: number;
    Note?: string;
    TransactionDate?: string;
}

export interface SetOpeningBalanceDTO {
    ShopNo: number;
    Amount: number;
}

export interface CashTransfer {
    Id: number;
    FromShopNo: number;
    ToShopNo: number;
    Amount: number;
    Note: string | null;
    UserId: number;
    TransferDate: string;
    Status: string;
    User?: { Firstname: string; Lastname?: string };
}

// ──────────────────────────── API Calls ────────────────────────────

export const getCashBookEntries = async (params: {
    shopNo?: number;
    startDate?: string;
    endDate?: string;
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    entryType?: string;
}, options?: AxiosRequestConfig) => {
    const res = await api.get<CashBookEntryResponse[]>('/cashbook', { params, ...options });
    return res.data;
};

export const getCashBookSummary = async (params: {
    shopNo?: number;
    startDate?: string;
    endDate?: string;
}, options?: AxiosRequestConfig) => {
    const res = await api.get<CashBookSummary>('/cashbook/summary', { params, ...options });
    return res.data;
};

export const createManualEntry = async (dto: CreateManualEntryDTO, shopNo?: number) => {
    const res = await api.post('/cashbook/entry', dto, { params: { shopNo } });
    return res.data;
};

export const transferToMotherShop = async (dto: CreateCashTransferDTO, shopNo?: number) => {
    const res = await api.post('/cashbook/transfer', dto, { params: { shopNo } });
    return res.data;
};

export const exportCashBookPdf = async (date: string, shopNo?: number, shopName?: string) => {
    const response = await api.get('/cashbook/export/pdf', {
        params: { date, shopNo, shopName },
        responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const cleanShopName = (shopName || 'Shop').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `CashBook_${cleanShopName}_${date.split('T')[0]}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};

export const deleteCashBookEntry = async (id: number) => {
    const res = await api.delete(`/cashbook/${id}`);
    return res.data;
};

export const editCashBookEntry = async (id: number, dto: CreateManualEntryDTO) => {
    const res = await api.put(`/cashbook/${id}`, dto);
    return res.data;
};

export const getTransferHistory = async (params: {
    shopNo?: number;
    pageNumber?: number;
    pageSize?: number;
}) => {
    const res = await api.get<CashTransfer[]>('/cashbook/transfers', { params });
    return res.data;
};

export const setOpeningBalance = async (dto: SetOpeningBalanceDTO) => {
    const res = await api.post('/cashbook/opening-balance', dto);
    return res.data;
};

export const getCurrentBalance = async (shopNo: number) => {
    const res = await api.get<{ shopNo: number; balance: number }>(`/cashbook/balance/${shopNo}`);
    return res.data;
};
