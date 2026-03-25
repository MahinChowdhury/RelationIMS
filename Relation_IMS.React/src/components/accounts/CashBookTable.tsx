import type { CashBookEntry } from '../../pages/accounts/mockData';
import { useState } from 'react';

const formatCurrency = (amount: number, forceSign: boolean = false) => {
    const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));

    if (forceSign) {
        return amount > 0 ? `+ $${formatted}` : `- $${formatted}`;
    }
    return `$${formatted}`;
};

interface CashBookTableProps {
    entries: CashBookEntry[];
    totals: {
        cashIn: number;
        cashOut: number;
        closingBalance: number;
    };
}

const CashBookTable = ({ entries, totals }: CashBookTableProps) => {
    const [searchQuery, setSearchQuery] = useState('');

    const getCategoryStyle = (color: string) => {
        switch (color) {
            case 'emerald': return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
            case 'error': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
            case 'stone': return 'bg-gray-100 dark:bg-gray-500/20 text-gray-700 dark:text-gray-300';
            default: return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300';
        }
    };

    return (
        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm overflow-hidden border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] mb-6">
            {/* Search & Filters */}
            <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-white/5 flex flex-wrap gap-3 sm:gap-4 items-center justify-between border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <span className="material-symbols-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-[20px]">search</span>
                    <input 
                        className="w-full pl-10 sm:pl-12 pr-4 py-2 sm:py-3 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-text-main dark:text-white placeholder:text-gray-400" 
                        placeholder="Search by description or reference..." 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                    <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 whitespace-nowrap shrink-0">
                        <span className="material-symbols-outlined text-sm">filter_list</span>
                        Filter
                    </button>
                    <button className="px-3 sm:px-4 py-2 sm:py-2.5 bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-white/10 flex items-center gap-2 whitespace-nowrap shrink-0">
                        <span className="material-symbols-outlined text-sm">calendar_month</span>
                        October 2024
                    </button>
                </div>
            </div>

            {/* Responsive Table View */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[450px]">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Date</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Ref No.</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Description</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Category</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Cash In</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Cash Out</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right">Balance</th>
                            <th className="px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-surface-dark-border)]">
                        {entries.map((entry, index) => (
                            <tr key={index} className={`transition-colors group ${entry.status === 'pending' ? 'hover:bg-red-50/50 dark:hover:bg-red-500/10' : 'hover:bg-primary/[0.03] dark:hover:bg-primary/5'}`}>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-[10px] sm:text-sm font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{entry.date}</td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-[10px] sm:text-xs font-mono text-gray-400 dark:text-gray-500 whitespace-nowrap">{entry.refNo}</td>
                                <td className="px-3 sm:px-4 py-4 sm:py-5 min-w-[150px]">
                                    <div className="flex flex-col">
                                        <span className="text-xs sm:text-sm font-bold text-text-main dark:text-white">{entry.description}</span>
                                        <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{entry.reference}</span>
                                    </div>
                                </td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5">
                                    <span className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-tighter rounded-full whitespace-nowrap ${getCategoryStyle(entry.categoryColor)}`}>
                                        {entry.category}
                                    </span>
                                </td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-primary text-right whitespace-nowrap">
                                    {entry.cashIn ? formatCurrency(entry.cashIn, true) : '—'}
                                </td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-text-main dark:text-white text-right whitespace-nowrap">
                                    {entry.cashOut ? formatCurrency(-Math.abs(entry.cashOut), true) : <span className="text-gray-300 dark:text-gray-600 font-medium">—</span>}
                                </td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-text-main dark:text-white text-right whitespace-nowrap">
                                    {formatCurrency(entry.balance)}
                                </td>
                                <td className="px-2 sm:px-4 py-4 sm:py-5 text-center">
                                    <span 
                                        className={`material-symbols-outlined text-sm ${entry.status === 'verified' ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}
                                        style={entry.status === 'verified' ? { fontVariationSettings: "'FILL' 1" } : {}}
                                        title={entry.status === 'verified' ? 'Verified' : 'Pending Review'}
                                    >
                                        {entry.status === 'verified' ? 'check_circle' : 'schedule'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-900 dark:bg-white/10 text-white">
                        <tr>
                            <td className="px-2 sm:px-4 py-5 sm:py-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap" colSpan={4}>Period Totals</td>
                            <td className="px-2 sm:px-4 py-5 sm:py-6 text-xs sm:text-sm font-extrabold text-primary text-right whitespace-nowrap">{formatCurrency(totals.cashIn, true)}</td>
                            <td className="px-2 sm:px-4 py-5 sm:py-6 text-xs sm:text-sm font-extrabold text-gray-300 text-right whitespace-nowrap">{formatCurrency(-Math.abs(totals.cashOut), true)}</td>
                            <td className="px-2 sm:px-4 py-5 sm:py-6 text-base sm:text-lg font-extrabold text-white text-right whitespace-nowrap">{formatCurrency(totals.closingBalance)}</td>
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default CashBookTable;
