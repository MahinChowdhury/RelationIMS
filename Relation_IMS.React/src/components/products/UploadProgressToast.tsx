import { useEffect, useState } from 'react';

export type ToastType = 'uploading' | 'success' | 'info';

export interface UploadToast {
    id: string;
    type: ToastType;
    message: string;
    current?: number;
    total?: number;
}

interface UploadProgressToastProps {
    toasts: UploadToast[];
    onDismiss: (id: string) => void;
}

export default function UploadProgressToast({ toasts, onDismiss }: UploadProgressToastProps) {
    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
            {toasts.map(toast => (
                <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onDismiss }: { toast: UploadToast; onDismiss: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (toast.type === 'success' || toast.type === 'info') {
            const timer = setTimeout(() => {
                setIsExiting(true);
                setTimeout(() => onDismiss(toast.id), 300);
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [toast.type, toast.id, onDismiss]);

    const percent = toast.total && toast.total > 0
        ? Math.round((toast.current! / toast.total) * 100)
        : 0;

    return (
        <div
            className={`pointer-events-auto bg-white dark:bg-[#1a2e22] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2a4032] p-4 transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0 animate-slideInRight'
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Icon */}
                {toast.type === 'uploading' && (
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-[#4e9767]/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-[#4e9767] animate-pulse">cloud_upload</span>
                    </div>
                )}
                {toast.type === 'success' && (
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-green-600 dark:text-green-400">check_circle</span>
                    </div>
                )}
                {toast.type === 'info' && (
                    <div className="shrink-0 w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">info</span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0e1b12] dark:text-white leading-tight">
                        {toast.message}
                    </p>

                    {toast.type === 'uploading' && toast.total && (
                        <div className="mt-2">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                    {typeof toast.current === 'number' ? toast.current.toFixed(2).replace(/\.00$/, '') : toast.current} / {toast.total} images
                                </span>
                                <span className="text-[11px] font-bold text-[#4e9767]">{percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] h-1.5 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Close button */}
                {toast.type !== 'uploading' && (
                    <button
                        onClick={() => { setIsExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
                        className="shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}
            </div>
        </div>
    );
}
