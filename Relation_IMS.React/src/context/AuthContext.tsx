import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    loginApi,
    registerApi,
    getUserInfoApi,
    setTokens,
    clearTokens,
    getAccessToken,
    type UserInfo,
} from '../services/authService';

interface AuthContextType {
    user: UserInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (phoneNumber: string, password: string, tenantId: string) => Promise<void>;
    register: (firstname: string, lastname: string, phoneNumber: string, password: string, tenantId: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const isAuthenticated = !!user;

    // On mount, check if we have a stored token and hydrate user
    useEffect(() => {
        const initAuth = async () => {
            const token = getAccessToken();
            if (token) {
                try {
                    const userInfo = await getUserInfoApi();
                    setUser(userInfo);
                } catch {
                    clearTokens();
                }
            }
            setIsLoading(false);
        };
        initAuth();
    }, []);

    const login = useCallback(async (phoneNumber: string, password: string, tenantId: string) => {
        const authResponse = await loginApi(phoneNumber, password, tenantId);
        setTokens(authResponse.AccessToken, authResponse.RefreshToken);

        const userInfo = await getUserInfoApi();
        setUser(userInfo);
    }, []);

    const register = useCallback(async (
        firstname: string,
        lastname: string,
        phoneNumber: string,
        password: string,
        tenantId: string
    ) => {
        await registerApi(firstname, lastname, phoneNumber, password, tenantId);
    }, []);

    const logout = useCallback(() => {
        clearTokens();
        setUser(null);
        navigate('/login');
    }, [navigate]);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
