import { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

interface ConfirmDeleteInputProps {
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    isDeleting?: boolean;
    deleteButtonText?: string;
}

export default function ConfirmDeleteInput({
    onConfirm,
    onCancel,
    confirmText = 'delete',
    isDeleting = false,
    deleteButtonText
}: ConfirmDeleteInputProps) {
    const { t } = useLanguage();
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        setInputValue('');
    }, [onCancel]);

    const isConfirmed = inputValue.toLowerCase().trim() === confirmText.toLowerCase();

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && isConfirmed && !isDeleting) {
            onConfirm();
        }
    };

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-text-main dark:text-gray-200 mb-2">
                    Type <span className="font-mono font-bold text-red-500">"{confirmText}"</span> to confirm delete
                </label>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={confirmText}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg bg-white dark:bg-[#132219] text-text-main dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-3">
                <button
                    onClick={onCancel}
                    disabled={isDeleting}
                    className="px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
                >
                    {t.common.cancel}
                </button>
                <button
                    onClick={onConfirm}
                    disabled={!isConfirmed || isDeleting}
                    className="px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-md shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isDeleting ? '...' : deleteButtonText || t.common.delete}
                </button>
            </div>
        </div>
    );
}
