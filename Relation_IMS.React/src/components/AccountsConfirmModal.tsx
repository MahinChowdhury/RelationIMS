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
            {/* Backdrop with strong blur */}
            <div 
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity animate-fadeIn" 
                onClick={onCancel}
            ></div>
            
            {/* Modal Body */}
            <div className="relative bg-white/90 dark:bg-[var(--color-surface-dark-card)] backdrop-blur-xl rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-[var(--color-surface-dark-border)] animate-[fadeIn_0.3s_ease-out]">
                
                {/* Decorative blob */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-primary to-primary-dark rounded-full blur-3xl opacity-[0.15] dark:opacity-20 pointer-events-none"></div>

                <div className="p-8 flex flex-col items-center text-center gap-5 relative z-10">
                    <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/30 transform transition-transform hover:scale-105">
                        <span className="material-symbols-outlined text-white text-[32px]">bar_chart</span>
                    </div>
                    
                    <div>
                        <h2 className="text-2xl font-extrabold text-text-main dark:text-white mb-2 leading-tight">
                            {t.nav.accounts}
                        </h2>
                        <p className="text-sm font-medium text-text-secondary dark:text-gray-400 leading-relaxed max-w-xs mx-auto">
                            {t.common.accountsConfirmation}
                        </p>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 px-8 pb-8 relative z-10">
                    <button
                        onClick={onCancel}
                        className="px-4 py-3 text-sm font-bold text-text-main bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-all dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-300 dark:hover:bg-white/5"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-3 text-sm font-bold text-white bg-gradient-to-r from-primary to-primary-dark rounded-xl hover:opacity-90 shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5"
                    >
                        {t.common.goToAccounts}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
