import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import en, { type Translations } from './en';
import bn from './bn';
import api from '../services/api';

type Language = 'en' | 'bn';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = { en, bn };

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('app-language');
        return (saved === 'bn' ? 'bn' : 'en') as Language;
    });

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('app-language', lang);
        api.put('/auth/me/language', { PreferredLanguage: lang }).catch(() => {
            // Ignore error
        });
    };

    const t = translations[language];

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    useEffect(() => {
        api.get('/auth/me/language').then(res => {
            if (res.data?.preferredLanguage) {
                const lang = res.data.preferredLanguage as Language;
                setLanguageState(lang);
                localStorage.setItem('app-language', lang);
            }
        }).catch(() => {
            // Ignore if not logged in
        });
    }, []);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
