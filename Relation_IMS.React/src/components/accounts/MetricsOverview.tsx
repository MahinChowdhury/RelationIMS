const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface MetricsOverviewProps {
    totalGrossRevenue: number;
    revenueChange: number;
    netIncomeMargin: number;
    marginTarget: number;
    returnsClaims: number;
    returnsPercent: number;
    topRegion: string;
    topRegionUnits: number;
}

const MetricsOverview = ({
    totalGrossRevenue,
    revenueChange,
    netIncomeMargin,
    marginTarget,
    returnsClaims,
    returnsPercent,
    topRegion,
    topRegionUnits,
}: MetricsOverviewProps) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-8 lg:mb-12">
            {/* Total Gross Revenue */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shadow-sm group">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 sm:mb-4">Total Gross Revenue</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-text-main dark:text-white">{formatCurrency(totalGrossRevenue)}</h3>
                <div className="mt-2 sm:mt-4 flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span className="text-[10px] sm:text-xs font-bold">+{revenueChange}% vs last term</span>
                </div>
            </div>

            {/* Net Income Margin */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 sm:mb-4">Net Income Margin</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-text-main dark:text-white">{netIncomeMargin}%</h3>
                <div className="mt-2 sm:mt-4 flex items-center gap-1 text-primary">
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                    <span className="text-[10px] sm:text-xs font-bold">Above Target ({marginTarget}%)</span>
                </div>
            </div>

            {/* Returns & Claims */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 sm:mb-4">Returns & Claims</p>
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-error">{formatCurrency(returnsClaims)}</h3>
                <div className="mt-2 sm:mt-4 flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <span className="material-symbols-outlined text-sm">history</span>
                    <span className="text-[10px] sm:text-xs font-bold">{returnsPercent}% of Gross Sales</span>
                </div>
            </div>

            {/* Top Region */}
            <div className="bg-gray-50 dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shadow-sm relative overflow-hidden">
                <div className="relative z-10">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2 sm:mb-4">Top Region</p>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tighter text-text-main dark:text-white">{topRegion}</h3>
                    <p className="text-[10px] sm:text-xs font-medium text-primary mt-2 sm:mt-4">{topRegionUnits.toLocaleString()} Units Sold</p>
                </div>
                <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                    <span className="material-symbols-outlined text-7xl sm:text-8xl" style={{ fontVariationSettings: "'FILL' 1" }}>globe_uk</span>
                </div>
            </div>
        </div>
    );
};

export default MetricsOverview;
