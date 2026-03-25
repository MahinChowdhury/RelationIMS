import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';

export const showFriendlyAlert = (message: any, title?: string, duration: number = 3000) => {
    return new Promise<void>((resolve) => {
        const messageStr = typeof message === 'string' ? message : String(message);

        const dialogContainer = document.createElement('div');
        document.body.appendChild(dialogContainer);
        const root = createRoot(dialogContainer);

        const closeDialog = () => {
            root.unmount();
            if (document.body.contains(dialogContainer)) {
                document.body.removeChild(dialogContainer);
            }
            resolve();
        };

        const isError = messageStr.toLowerCase().includes('fail') || messageStr.toLowerCase().includes('error');
        const iconName = isError ? 'error' : 'info';
        const iconColor = isError ? 'text-red-500' : 'text-primary';

        const ToastComponent = () => {
            const [progress, setProgress] = useState(100);

            useEffect(() => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                    setProgress(remaining);

                    if (elapsed >= duration) {
                        clearInterval(interval);
                        closeDialog();
                    }
                }, 16);

                return () => clearInterval(interval);
            }, []);

            return (
                <div className="fixed top-4 left-4 right-4 sm:left-auto sm:top-6 sm:right-6 z-[9999] pointer-events-none flex flex-col items-end">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] w-full sm:w-[400px] rounded-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden pointer-events-auto transform transition-all animate-in slide-in-from-top-8 sm:slide-in-from-right-8 fade-in duration-300">
                        <div className="flex items-start gap-3 p-3 min-h-[60px]">
                            <span className={`material-symbols-outlined shrink-0 text-2xl ${iconColor}`}>
                                {iconName}
                            </span>
                            <div className="flex flex-col w-full justify-center mt-auto mb-auto">
                                {title && (
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight mb-0.5">
                                        {title}
                                    </h3>
                                )}
                                <p className="text-gray-700 dark:text-gray-200 text-xs whitespace-pre-wrap leading-snug">
                                    {messageStr}
                                </p>
                            </div>
                            <button
                                onClick={closeDialog}
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
            );
        };

        root.render(<ToastComponent />);
    });
};

// Global override wrapper function
export const setupGlobalAlerts = () => {
    window.alert = (message?: any) => {
        showFriendlyAlert(message);
    };
};
