import { useLanguage } from '../../i18n/LanguageContext';

interface DeleteUserModalProps {
    show: boolean;
    userName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteUserModal({ show, userName, onCancel, onConfirm }: DeleteUserModalProps) {
    const { t } = useLanguage();
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
            <div className="relative bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-[#2a4032] animate-fadeIn">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="size-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text-main dark:text-white mb-1">Delete User</h2>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Are you sure you want to delete <strong>{userName}</strong>? {t.products.cannotBeUndone || 'This action cannot be undone.'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#132219] dark:border-[#2a4032] dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-md shadow-red-500/20 transition-all font-inter"
                    >
                        {t.common.yes}, {t.common.delete}
                    </button>
                </div>
            </div>
        </div>
    );
}
