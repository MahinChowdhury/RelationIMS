import type { CashBookEntryResponse } from '../../services/cashBookService';
import type { Inventory } from '../../types';

// ──────────────────────────── Formatters ────────────────────────────

const formatCurrency = (amount: number, forceSign = false) => {
    const formatted = new Intl.NumberFormat('en-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Math.abs(amount));
    if (forceSign) return amount > 0 ? `+ ৳${formatted}` : `- ৳${formatted}`;
    return `৳${formatted}`;
};

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

/** Shorten "CB-001-20260426-0003" → "CB: 3" */
const formatRefNo = (refNo: string) => {
    const lastDash = refNo.lastIndexOf('-');
    if (lastDash !== -1) {
        const seq = parseInt(refNo.slice(lastDash + 1), 10);
        if (!isNaN(seq)) return `CB: ${seq}`;
    }
    return refNo;
};

// ──────────────────────────── Static data ────────────────────────────

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const PRESETS = [
    { label: 'Today',      value: 'today'     },
    { label: 'Yesterday',  value: 'yesterday' },
] as const;

type DatePreset = typeof PRESETS[number]['value'];

// ──────────────────────────── Props ────────────────────────────

interface CashBookTableProps {
    entries: CashBookEntryResponse[];
    totals: { cashIn: number; cashOut: number; closingBalance: number };
    searchQuery: string;
    onSearchChange: (q: string) => void;
    isLoading?: boolean;
    // Shop selector (owner only)
    isOwner?: boolean;
    inventories?: Inventory[];
    selectedShopNo?: number;
    onShopChange?: (shopNo: number) => void;
    // Date
    selectedDate?: string;
    onDateChange?: (d: string) => void;
    onApplyPreset?: (preset: DatePreset) => void;
    onDeleteEntry?: (id: number) => void;
    onEditEntry?: (entry: CashBookEntryResponse) => void;
}

// ──────────────────────────── Helper: entry type badge colour ────────────────────────────

const getEntryTypeStyle = (type: string) => {
    switch (type) {
        case 'OrderPayment':
        case 'DuePayment':
        case 'ManualCashIn':
        case 'TransferIn':
        case 'OpeningBalance':
            return 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400';
        case 'Refund':
        case 'TransferOut':
        case 'ManualCashOut':
            return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
        default:
            return 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300';
    }
};

// ──────────────────────────── Component ────────────────────────────

const CashBookTable = ({
    entries, totals, searchQuery, onSearchChange, isLoading,
    isOwner, inventories = [], selectedShopNo, onShopChange,
    selectedDate, onDateChange, onApplyPreset, onDeleteEntry, onEditEntry
}: CashBookTableProps) => {

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const getActivePreset = (): DatePreset | null => {
        if (!selectedDate) return null;
        if (selectedDate === todayStr) return 'today';
        if (selectedDate === yesterdayStr) return 'yesterday';
        return null;
    };
    const activePreset = getActivePreset();

    return (
        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm overflow-hidden border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] mb-6 flex flex-col">

            {/* ══════════════ Filter Panel ══════════════ */}
            <div className="p-3 sm:p-4 bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] flex flex-col gap-3">

                {/* Filter Controls Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Left side: Shop Selector & Search */}
                    <div className="flex flex-wrap gap-3 items-center">
                        {isOwner && onShopChange && (
                            <div className="flex items-center gap-2 min-w-[190px]">
                                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-[18px] shrink-0">store</span>
                                <select
                                    value={selectedShopNo !== undefined ? String(selectedShopNo) : '0'}
                                    onChange={e => onShopChange(Number(e.target.value))}
                                    className="flex-1 py-2 px-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm font-semibold text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                >
                                    <option value="0" className="dark:bg-gray-800">HQ / Mother Shop</option>
                                    {inventories.map(inv => (
                                        <option key={inv.Id} value={String(inv.Id)} className="dark:bg-gray-800">{inv.Name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative min-w-[180px] max-w-sm">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 text-[20px]">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm font-medium text-text-main dark:text-white placeholder:text-gray-400"
                                placeholder="Search reference..."
                                type="text"
                                value={searchQuery}
                                onChange={e => onSearchChange(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Middle: Date Filters */}
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        {/* Quick preset chips */}
                        {onApplyPreset && PRESETS.map(p => (
                            <button
                                key={p.value}
                                onClick={() => onApplyPreset(p.value)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold transition-all border whitespace-nowrap ${
                                    activePreset === p.value
                                        ? 'bg-primary text-white border-primary shadow shadow-primary/25'
                                        : 'bg-white dark:bg-black/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:text-primary'
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}

                        {/* Thin divider */}
                        <span className="text-gray-300 dark:text-gray-700 text-sm select-none hidden sm:inline">|</span>

                        {/* Custom date range */}
                        <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-gray-400 text-[16px]">event</span>
                            <input
                                type="date"
                                value={selectedDate || ''}
                                onChange={e => onDateChange?.(e.target.value)}
                                className="py-1.5 px-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-[10px] sm:text-xs font-semibold text-text-main dark:text-white focus:ring-2 focus:ring-primary/20 cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Right: Active filter summary badge */}
                    {(selectedDate || selectedShopNo !== undefined) && (
                        <div className="flex items-center justify-end gap-2 text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-black/20 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm shrink-0">
                            <span className="material-symbols-outlined text-[14px] text-primary">filter_alt</span>
                            <span className="font-semibold text-primary">Viewing:</span>
                            {selectedShopNo !== undefined && (
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md font-bold">
                                    {selectedShopNo === 0 ? 'HQ' : (inventories.find(i => i.Id === selectedShopNo)?.Name ?? `Shop #${selectedShopNo}`)}
                                </span>
                            )}
                            {(selectedDate) && (
                                <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-md font-bold">
                                    {formatDate(selectedDate).split(',')[0]}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ══════════════ Table ══════════════ */}
            <div className="overflow-x-auto flex-1">
                {isLoading ? (
                    <div className="flex justify-center items-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                ) : (
                    <table className="w-full border-collapse text-left min-w-[580px]">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                                {[
                                    'Date', 'Ref', 'Description', 'Type',
                                    'Cash In', 'Cash Out', 'Balance', 'User', ''
                                ].map((h, i) => (
                                    <th
                                        key={h + i}
                                        className={`px-2 sm:px-4 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400 ${
                                            (i >= 4 && i < 7) ? 'text-right' : ''
                                        } ${i === 7 ? 'text-center' : ''}`}
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-[var(--color-surface-dark-border)]">
                            {entries.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-14 text-gray-400 dark:text-gray-500">
                                        <span className="material-symbols-outlined text-4xl block mb-2 opacity-25">receipt_long</span>
                                        <span className="text-sm">No transactions found for the selected period</span>
                                    </td>
                                </tr>
                            ) : entries.map(entry => (
                                <tr key={entry.Id} className="transition-colors hover:bg-primary/[0.03] dark:hover:bg-primary/5">
                                    {/* Date */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                        {formatDate(entry.TransactionDate)}
                                    </td>
                                    {/* Ref — compact */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 whitespace-nowrap">
                                        <span className="inline-block bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[9px] sm:text-[10px] font-extrabold font-mono px-2 py-1 rounded-md tracking-tight">
                                            {formatRefNo(entry.ReferenceNo)}
                                        </span>
                                    </td>
                                    {/* Description */}
                                    <td className="px-3 sm:px-4 py-4 sm:py-5 min-w-[140px]">
                                        <div className="flex flex-col">
                                            <span className="text-xs sm:text-sm font-bold text-text-main dark:text-white">{entry.Description || '—'}</span>
                                            {entry.Note && (
                                                <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{entry.Note}</span>
                                            )}
                                        </div>
                                    </td>
                                    {/* Type badge */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5">
                                        <span className={`px-2 py-1 text-[9px] font-extrabold uppercase tracking-tighter rounded-full whitespace-nowrap ${getEntryTypeStyle(entry.EntryType)}`}>
                                            {entry.TransactionType}
                                        </span>
                                    </td>
                                    {/* Cash In */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-primary text-right whitespace-nowrap">
                                        {entry.CashIn ? formatCurrency(entry.CashIn, true) : '—'}
                                    </td>
                                    {/* Cash Out */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-right whitespace-nowrap">
                                        {entry.CashOut
                                            ? <span className="text-text-main dark:text-white">{formatCurrency(-Math.abs(entry.CashOut), true)}</span>
                                            : <span className="text-gray-300 dark:text-gray-600 font-medium">—</span>
                                        }
                                    </td>
                                    {/* Running Balance */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-xs sm:text-sm font-extrabold text-text-main dark:text-white text-right whitespace-nowrap">
                                        {formatCurrency(entry.RunningBalance)}
                                    </td>
                                    {/* User */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                                        {entry.UserName || 'System'}
                                    </td>
                                    {/* Actions */}
                                    <td className="px-2 sm:px-4 py-4 sm:py-5 text-right whitespace-nowrap">
                                        {(entry.EntryType === 'ManualCashIn' || entry.EntryType === 'ManualCashOut' || entry.EntryType === 'OpeningBalance') && 
                                         ((new Date().getTime() - new Date(entry.TransactionDate).getTime()) / (1000 * 3600 * 24)) <= 7 && (
                                            <div className="flex justify-end gap-1">
                                                {onEditEntry && (
                                                    <button
                                                        onClick={() => onEditEntry(entry)}
                                                        className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                        title="Edit manual entry"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                )}
                                                {onDeleteEntry && (
                                                    <button
                                                        onClick={() => onDeleteEntry(entry.Id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Delete manual entry"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-900 dark:bg-white/10 text-white">
                            <tr>
                                <td colSpan={4} className="px-2 sm:px-4 py-5 sm:py-6 text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-400 whitespace-nowrap">
                                    Period Totals
                                </td>
                                <td className="px-2 sm:px-4 py-5 sm:py-6 text-xs sm:text-sm font-extrabold text-primary text-right whitespace-nowrap">
                                    {formatCurrency(totals.cashIn, true)}
                                </td>
                                <td className="px-2 sm:px-4 py-5 sm:py-6 text-xs sm:text-sm font-extrabold text-gray-300 text-right whitespace-nowrap">
                                    {formatCurrency(-Math.abs(totals.cashOut), true)}
                                </td>
                                <td className="px-2 sm:px-4 py-5 sm:py-6 text-base sm:text-lg font-extrabold text-white text-right whitespace-nowrap">
                                    {formatCurrency(totals.closingBalance)}
                                </td>
                                <td colSpan={2} />
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CashBookTable;
