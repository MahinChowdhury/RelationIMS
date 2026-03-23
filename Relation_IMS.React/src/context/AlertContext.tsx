import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertContextType {
    showAlert: (message: string, type?: AlertType, title?: string, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<AlertType>('info');
    const [title, setTitle] = useState<string | undefined>();
    const [duration, setDuration] = useState(3000);
    const [progress, setProgress] = useState(100);

    const showAlert = (newMessage: string, newType: AlertType = 'info', newTitle?: string, newDuration: number = 3000) => {
        setMessage(newMessage);
        setType(newType);
        setTitle(newTitle);
        setDuration(newDuration);
        setProgress(100);
        setIsOpen(true);
    };

    const closeAlert = () => setIsOpen(false);

    useEffect(() => {
        if (!isOpen) return;

        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);

            if (elapsed >= duration) {
                clearInterval(interval);
                closeAlert();
            }
        }, 16);

        return () => clearInterval(interval);
    }, [isOpen, duration]);

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check_circle';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'info';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success': return 'text-green-500';
            case 'warning': return 'text-yellow-500';
            case 'error': return 'text-red-500';
            default: return 'text-primary';
        }
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}
            {isOpen && (
                <div className="fixed top-4 left-4 right-4 sm:left-auto sm:top-6 sm:right-6 z-[9999] pointer-events-none flex flex-col items-end">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] w-full sm:w-[400px] rounded-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden pointer-events-auto transform transition-all animate-in slide-in-from-top-8 sm:slide-in-from-right-8 fade-in duration-300">
                        <div className="flex items-start gap-3 p-3 min-h-[60px]">
                            <span className={`material-symbols-outlined shrink-0 text-2xl ${getIconColor()}`}>
                                {getIcon()}
                            </span>
                            <div className="flex flex-col w-full justify-center mt-auto mb-auto">
                                {title && (
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                                        {title}
                                    </h3>
                                )}
                                <p className="text-gray-700 dark:text-gray-200 text-xs whitespace-pre-wrap leading-snug">
                                    {message}
                                </p>
                            </div>
                            <button
                                onClick={closeAlert}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>
                        {/* Progress Bar */}
                        <div className="h-1 w-full bg-gray-100 dark:bg-gray-800 flex justify-end">
                            <div
                                className="h-full bg-red-500 transition-all duration-75 ease-linear"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error('useAlert must be used within an AlertProvider');
    }
    return context;
}
