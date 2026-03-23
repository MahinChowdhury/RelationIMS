import { createPortal } from 'react-dom';

interface LogoutConfirmModalProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function LogoutConfirmModal({ show, onCancel, onConfirm }: LogoutConfirmModalProps) {
    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-start md:items-center justify-center p-4 pt-4 md:pt-0">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
            <div className="relative bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-[var(--color-surface-dark-border)] animate-fadeIn">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="size-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">logout</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text-main dark:text-white mb-1">Logout</h2>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Are you sure you want to log out?
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#132219] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-md shadow-red-500/20 transition-all font-inter"
                    >
                        Yes, Logout
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
