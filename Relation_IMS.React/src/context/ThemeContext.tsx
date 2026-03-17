import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../services/api';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>(() => {
        const saved = localStorage.getItem('app-theme');
        return (saved === 'dark' ? 'dark' : 'light') as Theme;
    });

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('app-theme', newTheme);
        api.put('/auth/me/theme', { PreferredTheme: newTheme }).catch(() => {
            // Ignore error (e.g. not logged in)
        });
    };

    // Apply the dark class to <html>
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            document.getElementById('theme-color-meta')?.setAttribute('content', '#112116');
        } else {
            root.classList.remove('dark');
            document.getElementById('theme-color-meta')?.setAttribute('content', '#f8fcf9');
        }
    }, [theme]);

    // On mount, fetch backend preference
    useEffect(() => {
        api.get('/auth/me/theme').then(res => {
            if (res.data?.preferredTheme) {
                const t = res.data.preferredTheme as Theme;
                setThemeState(t);
                localStorage.setItem('app-theme', t);
            }
        }).catch(() => {
            // Ignore if not logged in
        });
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark: theme === 'dark' }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
