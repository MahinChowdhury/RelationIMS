import type { MonthlySalesRow } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface MonthlySalesTableProps {
    data: MonthlySalesRow[];
    totals: {
        grossSales: number;
        discounts: number;
        returns: number;
        netIncome: number;
    };
}

const MonthlySalesTable = ({ data, totals }: MonthlySalesTableProps) => {
    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return { icon: 'trending_up', color: 'text-primary' };
            case 'down': return { icon: 'trending_down', color: 'text-error' };
            case 'rocket': return { icon: 'rocket_launch', color: 'text-primary', fill: true };
            default: return { icon: 'trending_flat', color: 'text-gray-400' };
        }
    };

    return (
        <section className="mb-8 lg:mb-12">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 px-1 sm:px-2 gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Monthly Sales Breakdown</h2>
                <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-tighter">Fiscal: {new Date().getFullYear()}</span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-tighter">Audited</span>
                </div>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-xl bg-white dark:bg-[var(--color-surface-dark-card)] shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Period</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Gross Sales</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Discounts</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Returns</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Net Income</th>
                            <th className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">Trend</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-surface-dark-border)]">
                        {data.map((row, index) => {
                            const trend = getTrendIcon(row.trend);
                            return (
                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 font-bold text-xs sm:text-sm text-text-main dark:text-white">{row.period}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">{formatCurrency(row.grossSales)}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">({formatCurrency(row.discounts)})</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-right whitespace-nowrap">({formatCurrency(row.returns)})</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-extrabold text-text-main dark:text-white text-right whitespace-nowrap">{formatCurrency(row.netIncome)}</td>
                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                                        <span
                                            className={`material-symbols-outlined text-base sm:text-lg ${trend.color}`}
                                            style={trend.fill ? { fontVariationSettings: "'FILL' 1" } : {}}
                                        >
                                            {trend.icon}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="bg-gray-900 dark:bg-white/10 text-white">
                            <td className="px-4 sm:px-6 py-3 sm:py-4 font-extrabold text-xs sm:text-sm whitespace-nowrap">TOTAL YTD</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-right whitespace-nowrap">{formatCurrency(totals.grossSales)}</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-right whitespace-nowrap">({formatCurrency(totals.discounts)})</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-right whitespace-nowrap">({formatCurrency(totals.returns)})</td>
                            <td className="px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-extrabold text-right text-primary whitespace-nowrap">{formatCurrency(totals.netIncome)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
};

export default MonthlySalesTable;
