import api from './api';
import type { AuditLogResponse } from '../types/auditLog';

export const getAuditLogs = async (params: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    date?: string;
    actionType?: string;
    userId?: number;
}): Promise<AuditLogResponse> => {
    const response = await api.get<AuditLogResponse>('/AuditLog', { params });
    return response.data;
};
