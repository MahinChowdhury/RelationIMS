import type { BalanceSheetSection as SectionData } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(absAmount);
    return amount < 0 ? `(${formatted})` : formatted;
};

interface BalanceSheetSectionCardProps {
    section: SectionData;
}

const BalanceSheetSectionCard = ({ section }: BalanceSheetSectionCardProps) => {
    const isPrimary = section.colorClass === 'primary';

    return (
        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-4 sm:p-6 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] shadow-sm">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h3 className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${isPrimary ? 'text-primary' : 'text-secondary'}`}>
                    {section.title}
                </h3>
                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">{section.subtitle}</span>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[300px]">
                    <tbody className="divide-y divide-gray-100 dark:divide-[var(--color-surface-dark-border)]">
                        {section.items.map((item, index) => (
                            <tr key={index} className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                <td className="py-2.5 sm:py-3 font-medium text-text-main dark:text-white text-xs sm:text-sm whitespace-nowrap">{item.label}</td>
                                <td className={`py-2.5 sm:py-3 text-right tabular-nums text-xs sm:text-sm whitespace-nowrap ${item.isNegative ? 'text-error' : 'text-text-main dark:text-white'}`}>
                                    {formatCurrency(item.amount)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td className="pt-3 sm:pt-4 font-bold text-text-main dark:text-white text-xs sm:text-sm whitespace-nowrap">{section.totalLabel}</td>
                            <td className={`pt-3 sm:pt-4 text-right font-bold tabular-nums text-xs sm:text-sm border-t-2 whitespace-nowrap ${isPrimary ? 'text-primary border-primary/20' : 'text-secondary border-secondary/20'}`}>
                                {formatCurrency(section.total)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default BalanceSheetSectionCard;
