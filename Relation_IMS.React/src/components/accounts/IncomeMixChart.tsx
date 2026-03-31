import type { IncomeMixCategory } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
    }).format(amount);
};

interface IncomeMixChartProps {
    data: IncomeMixCategory[];
}

const IncomeMixChart = ({ data }: IncomeMixChartProps) => {
    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] p-5 sm:p-8 rounded-xl shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Income Mix by Category</h2>
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">pie_chart</span>
            </div>
            <div className="space-y-5 sm:space-y-6">
                {data.map((item, index) => (
                    <div key={index}>
                        <div className="flex justify-between text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-2">
                            <span>{item.name}</span>
                            <span className="text-text-main dark:text-white">{item.percentage}% • {formatCurrency(item.amount)}</span>
                        </div>
                        <div className="w-full h-2.5 sm:h-3 bg-gray-100 dark:bg-[#2a4032] rounded-full overflow-hidden">
                            <div
                                className={`h-full ${item.colorClass} rounded-full transition-all duration-700 ease-out`}
                                style={{ width: `${item.percentage}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 sm:mt-8 p-3 sm:p-4 bg-gray-50 dark:bg-white/5 rounded-lg flex items-start gap-3 sm:gap-4">
                <span className="material-symbols-outlined text-primary shrink-0">eco</span>
                <div>
                    <p className="text-xs font-bold text-text-main dark:text-white">Sustainable Insight</p>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 leading-relaxed">Organic cotton Shirts drive 40% higher margin compared to the seasonal Polo collection.</p>
                </div>
            </div>
        </section>
    );
};

export default IncomeMixChart;
