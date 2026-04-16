import api from './api';
import type { AuditLogResponse, AuditSummary } from '../types/auditLog';

export const getAuditLogs = async (params: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    actionType?: string;
    category?: string;
    userId?: number;
}): Promise<AuditLogResponse> => {
    const response = await api.get<AuditLogResponse>('/AuditLog', { params });
    return response.data;
};

export const getAuditSummary = async (): Promise<AuditSummary> => {
    const response = await api.get<AuditSummary>('/AuditLog/summary');
    return response.data;
};
