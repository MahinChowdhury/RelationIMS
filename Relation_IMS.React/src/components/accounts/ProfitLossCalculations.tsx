

interface ProfitLossCalculationsProps {
    data: { netOperatingIncome: number; taxProvision: number; effectiveRate: number };
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

const ProfitLossCalculations = ({ data }: ProfitLossCalculationsProps) => {
    return (
        <section className="flex flex-col md:flex-row gap-4 lg:gap-6 mb-12 lg:mb-16">
            {/* Final Outcome Card */}
            <div className="flex-grow bg-primary text-white p-6 sm:p-8 lg:p-10 rounded-xl shadow-lg flex flex-col sm:flex-row sm:justify-between items-start sm:items-center overflow-hidden relative">
                <div className="relative z-10 mb-4 sm:mb-0">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/60">Final Outcome</span>
                    <h3 className="text-xl sm:text-2xl font-bold mt-1 sm:mt-2">Net Operating Income</h3>
                </div>
                <div className="sm:text-right relative z-10 w-full sm:w-auto">
                    <div className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter truncate" title={formatCurrency(data.netOperatingIncome)}>
                        {formatCurrency(data.netOperatingIncome)}
                    </div>
                    <p className="text-white/80 font-medium text-[10px] sm:text-xs lg:text-sm mt-1 sm:mt-2">
                        Post-tax projections pending final audit
                    </p>
                </div>
                {/* Background Decor */}
                <div className="absolute top-0 right-0 opacity-10 translate-x-1/4 -translate-y-1/4 hidden sm:block pointer-events-none">
                    <span className="material-symbols-outlined text-[150px] lg:text-[200px]" data-icon="account_balance">account_balance</span>
                </div>
            </div>

            {/* Tax Provision Card */}
            <div className="w-full md:w-72 lg:w-80 bg-gray-50 dark:bg-white/5 p-6 sm:p-8 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shrink-0 flex flex-col justify-center">
                <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">Tax Provision (Est.)</h4>
                <div className="flex justify-between items-end group">
                    <div>
                        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-text-main dark:text-white group-hover:text-primary transition-colors">
                            {formatCurrency(data.taxProvision)}
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-widest">
                            {data.effectiveRate}% Effective Rate
                        </p>
                    </div>
                    <div className="text-primary w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg" data-icon="receipt_long">receipt_long</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfitLossCalculations;
