import type { ProfitLossMetrics } from '../../pages/accounts/mockData';

interface ProfitLossPerformanceCardsProps {
    metrics: ProfitLossMetrics;
}

const formatCurrencyCompact = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
};

const ProfitLossPerformanceCards = ({ metrics }: ProfitLossPerformanceCardsProps) => {
    return (
        <section className="grid grid-cols-12 gap-4 lg:gap-6 mb-8 lg:mb-12">
            {/* Net Profit Margin */}
            <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-[var(--color-surface-dark-card)] p-6 lg:p-8 rounded-xl shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] flex flex-col justify-between min-h-[220px]">
                <div>
                    <div className="flex justify-between items-start mb-4 lg:mb-6">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Net Profit Margin</span>
                        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] lg:text-xs font-bold">
                            {metrics.marginChange}
                        </div>
                    </div>
                    <div className="text-5xl lg:text-6xl font-extrabold tracking-tighter text-text-main dark:text-white mb-4">
                        {metrics.netProfitMargin}%
                    </div>
                </div>
                {/* Simplified bar chart visualization */}
                <div className="h-12 lg:h-16 w-full flex items-end gap-1">
                    <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-t-sm h-[40%]"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-t-sm h-[55%]"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-t-sm h-[45%]"></div>
                    <div className="flex-1 bg-gray-100 dark:bg-white/10 rounded-t-sm h-[70%]"></div>
                    <div className="flex-1 bg-primary rounded-t-sm h-[85%]"></div>
                    <div className="flex-1 bg-primary rounded-t-sm h-[80%]"></div>
                    <div className="flex-1 bg-primary border shadow-sm shadow-primary/20 rounded-t-sm h-[95%]"></div>
                </div>
            </div>

            {/* Operating Ratio */}
            <div className="col-span-12 md:col-span-6 lg:col-span-3 bg-gray-900 dark:bg-white/5 text-white p-6 lg:p-8 rounded-xl shadow-lg border border-transparent dark:border-[var(--color-surface-dark-border)] flex flex-col justify-center overflow-hidden relative min-h-[220px]">
                <div className="relative z-10">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">Operating Ratio</span>
                    <div className="text-5xl lg:text-6xl font-extrabold tracking-tighter mt-2 lg:mt-4 text-white">
                        {metrics.operatingRatio}%
                    </div>
                    <p className="text-white/60 text-[10px] lg:text-xs mt-4 lg:mt-6 leading-relaxed">
                        System efficiency benchmark within sustainable architecture industry targets.
                    </p>
                </div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/30 rounded-full blur-3xl"></div>
            </div>

            {/* Revenue vs Expenses Chart */}
            <div className="col-span-12 lg:col-span-5 bg-gray-50 dark:bg-[var(--color-surface-dark-card)] p-6 lg:p-8 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] flex flex-col min-h-[220px]">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-6">Revenue vs Expenses Comparison</span>
                <div className="flex-grow flex items-end justify-around gap-4 lg:gap-8">
                    {/* Revenue Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[120px]">
                        <div className="w-full w-max-[80px] bg-primary rounded-xl shadow-sm shadow-primary/10 relative" style={{ height: '140px' }}>
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap hidden sm:block">
                                <span className="text-xs font-bold text-text-main dark:text-white">{formatCurrencyCompact(metrics.revenueValue)}</span>
                            </div>
                        </div>
                        <span className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold text-text-main dark:text-white sm:hidden">{formatCurrencyCompact(metrics.revenueValue)}</span>
                        <span className="mt-1 text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase">Revenue</span>
                    </div>

                    {/* Expenses Bar */}
                    <div className="flex flex-col items-center flex-1 max-w-[120px]">
                        <div className="w-full w-max-[80px] bg-gray-800 dark:bg-gray-400 rounded-xl shadow-sm relative" style={{ height: '100px' }}>
                             <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap hidden sm:block">
                                <span className="text-xs font-bold text-text-main dark:text-white">{formatCurrencyCompact(metrics.expensesValue)}</span>
                            </div>
                        </div>
                        <span className="mt-2 sm:mt-4 text-[10px] sm:text-xs font-bold text-text-main dark:text-white sm:hidden">{formatCurrencyCompact(metrics.expensesValue)}</span>
                        <span className="mt-1 text-[9px] sm:text-[10px] font-medium text-gray-500 uppercase">Expenses</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfitLossPerformanceCards;
