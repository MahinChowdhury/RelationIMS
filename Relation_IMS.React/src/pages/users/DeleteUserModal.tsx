import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import ConfirmDeleteInput from '../../components/ConfirmDeleteInput';

interface DeleteUserModalProps {
    show: boolean;
    userName: string;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function DeleteUserModal({ show, userName, onCancel, onConfirm }: DeleteUserModalProps) {
    const { t } = useLanguage();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!show) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-start md:items-center justify-center p-4 pt-4 md:pt-0">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onCancel}></div>
            <div className="relative bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-[var(--color-surface-dark-border)] animate-fadeIn">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="size-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 dark:text-red-400 text-[32px]">warning</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text-main dark:text-white mb-1">Delete User</h2>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            Are you sure you want to delete <strong>{userName}</strong>? {t.products.cannotBeUndone || 'This action cannot be undone.'}
                        </p>
                    </div>
                </div>
                <div className="px-6 pb-6">
                    <ConfirmDeleteInput
                        onConfirm={handleConfirm}
                        onCancel={onCancel}
                        isDeleting={isDeleting}
                    />
                </div>
            </div>
        </div>
    );
}
