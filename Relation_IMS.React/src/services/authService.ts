import api from './api';
import { applyTenantTheme } from './tenantTheme';

const CLIENT_ID = 'client-app-one';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const TENANT_KEY = 'tenantIdentifier';

// --- Token Storage Helpers ---

export function getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearTenant();
}

// --- Tenant Storage Helpers ---

export function getTenant(): string | null {
    return localStorage.getItem(TENANT_KEY);
}

export function setTenant(tenantIdentifier: string): void {
    localStorage.setItem(TENANT_KEY, tenantIdentifier);
}

export function clearTenant(): void {
    localStorage.removeItem(TENANT_KEY);
}

// --- Auth Response Type ---

export interface AuthResponse {
    AccessToken: string;
    RefreshToken: string;
    AccessTokenExpiresAt: string;
}

export interface UserInfo {
    Id: number;
    Firstname: string;
    Lastname: string | null;
    Email: string;
    PhoneNumber: string;
    PreferredLanguage: string;
    Roles: string[];
}

// --- API Calls ---

export async function loginApi(phoneNumber: string, password: string, tenantId: string): Promise<AuthResponse> {
    setTenant(tenantId);
    applyTenantTheme(tenantId);
    const res = await api.post<AuthResponse>('/auth/login', {
        PhoneNumber: phoneNumber,
        Password: password,
        ClientId: CLIENT_ID,
    });
    return res.data;
}

export async function registerApi(
    firstname: string,
    lastname: string,
    phoneNumber: string,
    password: string,
    tenantId: string
): Promise<void> {
    setTenant(tenantId);
    applyTenantTheme(tenantId);
    await api.post('/auth/register', {
        Firstname: firstname,
        Lastname: lastname,
        PhoneNumber: phoneNumber,
        Password: password,
    });
}

export async function refreshTokenApi(): Promise<AuthResponse | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;

    try {
        const res = await api.post<AuthResponse>('/auth/refresh-token', {
            RefreshToken: refreshToken,
            ClientId: CLIENT_ID,
        });
        return res.data;
    } catch {
        return null;
    }
}

export async function getUserInfoApi(): Promise<UserInfo> {
    const res = await api.get<UserInfo>('/auth/me');
    return res.data;
}

// Default export for convenience
const authService = {
    loginApi,
    registerApi,
    refreshTokenApi,
    getUserInfoApi,
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
};

export default authService;
