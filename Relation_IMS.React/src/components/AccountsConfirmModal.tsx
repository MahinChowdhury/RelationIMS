import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/LanguageContext';

interface AccountsConfirmModalProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export default function AccountsConfirmModal({ show, onCancel, onConfirm }: AccountsConfirmModalProps) {
    const { t } = useLanguage();

    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-fadeIn" 
                onClick={onCancel}
            ></div>
            
            {/* Modal Body: Windows Classic Style (Rectangle, Title Bar, Content, Bottom Actions) but Modern */}
            <div className="relative bg-white dark:bg-[var(--color-surface-dark-card)] rounded-md shadow-2xl w-full max-w-[400px] overflow-hidden border border-gray-200 dark:border-[var(--color-surface-dark-border)] animate-[fadeIn_0.2s_ease-out]">
                
                {/* Title Bar */}
                <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-primary to-primary-dark select-none">
                    <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-[16px]">bar_chart</span>
                        <h2 className="text-xs font-bold tracking-wide uppercase">
                            {t.nav.accounts}
                        </h2>
                    </div>
                    <button 
                        onClick={onCancel}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-sm p-0.5 transition-colors flex items-center justify-center"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 flex items-start gap-4">
                    <div className="shrink-0 pt-0.5">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                            <span className="material-symbols-outlined text-primary text-[24px]">help</span>
                        </div>
                    </div>
                    
                    <div className="flex-1">
                        <p className="text-sm font-medium text-text-main dark:text-gray-300 leading-relaxed mt-1">
                            {t.common.accountsConfirmation}
                        </p>
                    </div>
                </div>
                
                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 px-6 py-3 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                    <button
                        onClick={onConfirm}
                        className="min-w-[80px] px-4 py-1.5 text-sm font-bold text-white bg-primary border border-primary hover:bg-primary-dark rounded shadow-sm transition-all active:scale-95"
                    >
                        {t.common.goToAccounts || 'Confirm'}
                    </button>
                    <button
                        onClick={onCancel}
                        className="min-w-[80px] px-4 py-1.5 text-sm font-bold text-text-main bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-sm transition-all dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 active:scale-95"
                    >
                        {t.common.cancel}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
