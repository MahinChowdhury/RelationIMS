import api from './api';
import type { AxiosRequestConfig } from 'axios';
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
}, options?: AxiosRequestConfig): Promise<AuditLogResponse> => {
    const response = await api.get<AuditLogResponse>('/AuditLog', { params, ...options });
    return response.data;
};

export const getAuditSummary = async (options?: AxiosRequestConfig): Promise<AuditSummary> => {
    const response = await api.get<AuditSummary>('/AuditLog/summary', options);
    return response.data;
};
