import React from 'react';
import type { ProfitLossStatementRow } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number, forceParenthesesForNegative: boolean = true) => {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(absAmount);
    
    if (amount < 0 && forceParenthesesForNegative) {
        return `($${formatted})`;
    }
    return `$${formatted}`;
};

interface ProfitLossTableProps {
    rows: ProfitLossStatementRow[];
}

const ProfitLossTable = ({ rows }: ProfitLossTableProps) => {
    // Helper function to group the rows into their sections (Revenue, COGS, OPEX, etc.)
    const sections = ['Revenue', 'COGS', 'OPEX'];

    const getRowStyle = (row: ProfitLossStatementRow) => {
        if (row.isSubtotal) {
            if (row.section === 'Revenue') return 'bg-primary/5 border-t border-primary/10';
            if (row.section === 'COGS') return 'bg-gray-100 dark:bg-white/10 border-t border-gray-200 dark:border-gray-700';
            if (row.section === 'OPEX') return 'bg-gray-900 dark:bg-black/40 text-white';
        }
        return 'group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors';
    };

    const getLabelStyle = (row: ProfitLossStatementRow) => {
        if (row.isHeader && !row.isSubtotal) return 'font-bold text-text-main dark:text-white';
        if (row.isSubtotal) {
            if (row.section === 'Revenue') return 'font-extrabold text-primary uppercase text-[10px] sm:text-xs tracking-tight';
            if (row.section === 'COGS') return 'font-extrabold text-text-main dark:text-white uppercase text-[10px] sm:text-xs tracking-tight';
            if (row.section === 'OPEX') return 'font-extrabold uppercase text-[10px] sm:text-xs tracking-tight text-primary z-10';
        }
        return 'text-transparent'; // hide from this column on normal rows
    };

    const getDetailsStyle = (row: ProfitLossStatementRow) => {
        if (row.isSubtotal) return '';
        if (row.isHeader) return 'font-medium text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-left sm:text-right';
        return 'text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-left sm:text-right';
    };

    const getAmountStyle = (row: ProfitLossStatementRow) => {
        if (row.isNegative) return 'text-error font-medium';
        if (row.isSubtotal) return 'font-extrabold text-sm sm:text-base';
        return 'font-medium text-text-main dark:text-white';
    };

    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] overflow-hidden mb-8 lg:mb-12">
            <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] bg-gray-50/50 dark:bg-white/5 flex justify-between items-center break-words">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight text-text-main dark:text-white">Statement of Operations</h3>
                <span className="text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/10 px-2 sm:px-3 py-1 rounded shrink-0 ml-2">Values in USD</span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="bg-gray-50/80 dark:bg-white/5">
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary w-1/4 sm:w-1/3">Line Item</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary text-left sm:text-right w-1/2 sm:w-auto">Details</th>
                            <th className="px-4 sm:px-8 py-3 sm:py-4 text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest text-primary text-right w-1/4 sm:w-auto">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-[var(--color-surface-dark-border)]">
                        {sections.map(sectionName => {
                            const sectionRows = rows.filter(r => r.section === sectionName);
                            return (
                                <React.Fragment key={sectionName}>
                                    {sectionRows.map((row) => (
                                        <tr key={row.id} className={getRowStyle(row)}>
                                            <td className={`px-4 sm:px-8 py-3 sm:py-5 ${getLabelStyle(row)}`}>
                                                {(row.isHeader && !row.isSubtotal) ? row.section : (row.isSubtotal ? row.label : '')}
                                            </td>
                                            <td className={`px-4 sm:px-8 py-3 sm:py-5 ${getDetailsStyle(row)}`}>
                                                {!row.isSubtotal && row.label}
                                            </td>
                                            <td className={`px-4 sm:px-8 py-3 sm:py-5 text-right whitespace-nowrap ${getAmountStyle(row)}`}>
                                                {formatCurrency(row.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default ProfitLossTable;
