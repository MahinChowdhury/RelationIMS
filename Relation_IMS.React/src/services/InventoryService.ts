import api from './api';
import type { AxiosRequestConfig } from 'axios';
import type { InventoryTransferHistoryResponse } from '../types/inventory';
import type { Inventory } from '../types';

export const getAllInventories = async (options?: AxiosRequestConfig): Promise<Inventory[]> => {
    const res = await api.get('/Inventory', options);
    return res.data;
};

export const getInventoryMovementHistory = async (params: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    date?: string; // ISO Date string YYYY-MM-DD
    sourceId?: number;
    destinationId?: number;
    userId?: number;
}, options?: AxiosRequestConfig) => {
    const response = await api.get<InventoryTransferHistoryResponse[]>('/Inventory/transfer/history', {
        params,
        ...options
    });
    return response.data;
};
