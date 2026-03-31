import type { LedgerSummary } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface LedgerSummaryCardsProps {
    summary: LedgerSummary;
}

const LedgerSummaryCards = ({ summary }: LedgerSummaryCardsProps) => {
    return (
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Opening Balance */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-2xl flex flex-col justify-between group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                <div className="flex justify-between items-start">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">Opening Balance</span>
                    <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:text-primary transition-colors hidden sm:block">account_balance_wallet</span>
                </div>
                <div className="mt-3 sm:mt-4">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-text-main dark:text-white">{formatCurrency(summary.openingBalance)}</p>
                    <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-1 uppercase font-bold tracking-widest">As of {summary.openingDate}</p>
                </div>
            </div>

            {/* Total Debits */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-2xl flex flex-col justify-between group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                <div className="flex justify-between items-start">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">Total Debits</span>
                    <span className="material-symbols-outlined text-primary hidden sm:block">arrow_upward</span>
                </div>
                <div className="mt-3 sm:mt-4">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-primary">{formatCurrency(summary.totalDebits)}</p>
                    <p className="text-[9px] sm:text-[10px] text-primary/60 mt-1 uppercase font-bold tracking-widest">+{summary.debitsChange}% vs last period</p>
                </div>
            </div>

            {/* Total Credits */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-2xl flex flex-col justify-between group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-colors border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                <div className="flex justify-between items-start">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-gray-500 dark:text-gray-400">Total Credits</span>
                    <span className="material-symbols-outlined text-error hidden sm:block">arrow_downward</span>
                </div>
                <div className="mt-3 sm:mt-4">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-error">{formatCurrency(summary.totalCredits)}</p>
                    <p className="text-[9px] sm:text-[10px] text-error/60 mt-1 uppercase font-bold tracking-widest">{summary.creditsChange}% vs last period</p>
                </div>
            </div>

            {/* Closing Balance */}
            <div className="bg-primary text-white p-4 sm:p-6 rounded-2xl flex flex-col justify-between shadow-xl shadow-primary/20 col-span-2 lg:col-span-1">
                <div className="flex justify-between items-start">
                    <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-white/70">Closing Balance</span>
                    <span className="material-symbols-outlined text-white/80 hidden sm:block" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance</span>
                </div>
                <div className="mt-3 sm:mt-4">
                    <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tighter">{formatCurrency(summary.closingBalance)}</p>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white/40"></span>
                        <p className="text-[9px] sm:text-[10px] text-white/60 uppercase font-bold tracking-widest">Adjusted Balance</p>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default LedgerSummaryCards;
