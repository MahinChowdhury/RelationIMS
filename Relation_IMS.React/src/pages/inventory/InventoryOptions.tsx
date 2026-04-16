import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

const InventoryOptions = () => {
    const { t } = useLanguage();
    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
           

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{t.inventory.overview}</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base max-w-2xl">
                        {t.inventory.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span className="hidden sm:inline">{t.inventory.exportReport || 'Export Report'}</span>
                        <span className="sm:hidden">{t.common.exportCSV || 'Export'}</span>
                    </button>
                </div>
            </div>

            {/* Grid Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <Link to="/inventory/locations" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-primary/50 transition-all">
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.locations}</h3>
                </Link>

                <Link to="/inventory/stock-in" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-blue-600/50 transition-all">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">input</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.stockIn}</h3>
                </Link>

                <Link to="/inventory/transfer" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-purple-600/50 transition-all">
                    <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">local_shipping</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.transfer}</h3>
                </Link>

                <Link to="/inventory/history" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-orange-600/50 transition-all">
                    <div className="p-3 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">history</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.movementHistory}</h3>
                </Link>

                <Link to="/inventory/defects" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-gray-600/50 transition-all">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">production_quantity_limits</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.defects}</h3>
                </Link>

                <Link to="/inventory/customer-return" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-pink-600/50 transition-all">
                    <div className="p-3 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">keyboard_return</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.customerReturn}</h3>
                </Link>

                <Link to="/inventory/audit-logs" className="col-span-2 md:col-span-1 group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-teal-600/50 transition-all">
                    <div className="p-3 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">plagiarism</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.auditLogs || 'Audit Logs'}</h3>
                </Link>
            </div>
        </div>
    );
};

export default InventoryOptions;
