interface LedgerStatusProps {
    period: string;
    lastReconciliation: string;
    isBalanced: boolean;
}

const LedgerStatus = ({ period, lastReconciliation, isBalanced }: LedgerStatusProps) => {
    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
            <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-xl sm:text-2xl">
                        {isBalanced ? 'verified' : 'warning'}
                    </span>
                </div>
                <div>
                    <h3 className="text-sm font-extrabold tracking-tight text-text-main dark:text-white">
                        Ledger Status: {isBalanced ? 'Balanced' : 'Unbalanced'}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">Last reconciliation: {lastReconciliation}</p>
                </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                All transactions for the period of <span className="font-bold text-text-main dark:text-white">{period}</span> have been verified against source documents. The trial balance is currently in equilibrium with zero variance detected across active accounts.
            </p>
            <div className="mt-4 sm:mt-6 flex items-center gap-4">
                <button className="text-primary text-[10px] sm:text-xs font-extrabold uppercase tracking-widest hover:underline transition-all">Audit Logs</button>
                <div className="h-1 w-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
                <button className="text-primary text-[10px] sm:text-xs font-extrabold uppercase tracking-widest hover:underline transition-all">Download Report</button>
            </div>
        </section>
    );
};

export default LedgerStatus;
