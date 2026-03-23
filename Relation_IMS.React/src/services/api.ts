import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, getTenant, type AuthResponse } from './authService';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5051/api/v1';
//export const API_BASE_URL = 'http://localhost:5051/api/v1';
const CLIENT_ID = 'client-app-one';

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true,
});

// --- Request Interceptor: attach Authorization and Tenant headers ---
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        const tenant = getTenant();
        if (tenant) {
            config.headers['__tenant__'] = tenant;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// --- Response Interceptor: auto-refresh on 401 ---
let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh if this IS the refresh or login request
            if (
                originalRequest.url?.includes('/auth/login') ||
                originalRequest.url?.includes('/auth/refresh-token')
            ) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue requests while refreshing
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = getRefreshToken();
            if (!refreshToken) {
                clearTokens();
                if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/products/share-catalog')) {
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }

            try {
                const res = await axios.post<AuthResponse>(
                    `${API_BASE_URL}/auth/refresh-token`,
                    { RefreshToken: refreshToken, ClientId: CLIENT_ID },
                    { headers: { 'Content-Type': 'application/json' } }
                );

                const { AccessToken, RefreshToken: newRefresh } = res.data;
                setTokens(AccessToken, newRefresh);

                processQueue(null, AccessToken);

                originalRequest.headers.Authorization = `Bearer ${AccessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                clearTokens();
                if (window.location.pathname !== '/login' && !window.location.pathname.startsWith('/products/share-catalog')) {
                    window.location.href = '/login';
                }
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
