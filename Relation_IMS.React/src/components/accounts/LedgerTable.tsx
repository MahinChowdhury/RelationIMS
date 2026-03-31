import type { LedgerEntry } from '../../pages/accounts/mockData';
import { useState } from 'react';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
};

interface LedgerTableProps {
    entries: LedgerEntry[];
    totals: {
        totalDebit: number;
        totalCredit: number;
        closingBalance: number;
    };
}

const LedgerTable = ({ entries, totals }: LedgerTableProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const totalEntries = 42; // Mock total
    const entriesPerPage = 6;
    const totalPages = Math.ceil(totalEntries / entriesPerPage);

    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] mb-6 sm:mb-8">
            {/* Responsive Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">Date</th>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">Account Code</th>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">Description</th>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] text-right">Debit ($)</th>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] text-right">Credit ($)</th>
                            <th className="px-4 sm:px-6 py-3 lg:py-5 text-[10px] font-extrabold tracking-widest uppercase text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] text-right">Balance ($)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-surface-dark-border)]">
                        {entries.map((entry, index) => (
                            <tr key={index} className="hover:bg-primary/[0.03] dark:hover:bg-primary/[0.05] transition-colors group">
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">{entry.date}</td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4">
                                    <span className="text-[10px] sm:text-xs font-bold bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-text-main dark:text-white whitespace-nowrap">{entry.accountCode}</span>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 min-w-[200px]">
                                    <p className="text-xs sm:text-sm font-medium text-text-main dark:text-white">{entry.description}</p>
                                    <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{entry.reference}</p>
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right whitespace-nowrap">
                                    {entry.debit !== null ? (
                                        <span className="font-extrabold text-primary">{formatCurrency(entry.debit)}</span>
                                    ) : (
                                        <span className="font-medium text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-right whitespace-nowrap">
                                    {entry.credit !== null ? (
                                        <span className="font-extrabold text-error">{formatCurrency(entry.credit)}</span>
                                    ) : (
                                        <span className="font-medium text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                </td>
                                <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-bold text-text-main dark:text-white text-right whitespace-nowrap">{formatCurrency(entry.balance)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-white/5">
                        <tr>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 lg:py-6 text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 text-right whitespace-nowrap" colSpan={3}>Period Totals</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-extrabold text-primary text-right whitespace-nowrap">{formatCurrency(totals.totalDebit)}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-extrabold text-error text-right whitespace-nowrap">{formatCurrency(totals.totalCredit)}</td>
                            <td className="px-4 sm:px-6 py-4 sm:py-5 lg:py-6 text-sm sm:text-base lg:text-lg font-extrabold text-primary text-right whitespace-nowrap">{formatCurrency(totals.closingBalance)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between border-t border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                    Showing 1 to {entries.length} of {totalEntries} entries
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-[var(--color-surface-dark-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-[10px] sm:text-xs transition-all ${currentPage === page
                                ? 'bg-primary text-white'
                                : 'border border-gray-200 dark:border-[var(--color-surface-dark-border)] hover:bg-gray-50 dark:hover:bg-white/5 text-text-main dark:text-white'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 sm:p-2 rounded-lg border border-gray-200 dark:border-[var(--color-surface-dark-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-all disabled:opacity-30"
                    >
                        <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default LedgerTable;
