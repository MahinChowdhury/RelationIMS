import api from './api';
import type { InventoryTransferHistoryResponse } from '../types/inventory';

export const getInventoryMovementHistory = async (params: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    date?: string; // ISO Date string YYYY-MM-DD
    sourceId?: number;
    destinationId?: number;
    userId?: number;
}) => {
    const response = await api.get<InventoryTransferHistoryResponse[]>('/Inventory/transfer/history', {
        params
    });
    return response.data;
};
