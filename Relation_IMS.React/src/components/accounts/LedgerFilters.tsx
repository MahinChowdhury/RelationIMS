import { useState } from 'react';

interface LedgerFiltersProps {
    onSearch?: (query: string) => void;
    onFilterChange?: (type: string) => void;
}

const LedgerFilters = ({ onSearch, onFilterChange }: LedgerFiltersProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [accountType, setAccountType] = useState('all');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleTypeChange = (value: string) => {
        setAccountType(value);
        onFilterChange?.(value);
    };

    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] p-3 sm:p-5 rounded-2xl mb-6 sm:mb-8 shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
            {/* Mobile: Search + Filter Toggle */}
            <div className="flex gap-2 sm:gap-4 items-center">
                {/* Search */}
                <div className="flex-1 relative">
                    <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-gray-400 dark:text-gray-500 text-[20px]">search</span>
                    <input
                        className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] focus:ring-2 focus:ring-primary/20 focus:border-primary/30 text-sm font-medium transition-all text-text-main dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        placeholder="Search Account Code or Description..."
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>

                {/* Mobile Filter Toggle */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`sm:hidden p-2.5 rounded-xl border transition-all ${showFilters
                        ? 'bg-primary/10 border-primary/30 text-primary'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-[var(--color-surface-dark-border)] text-gray-500 dark:text-gray-400'
                        }`}
                >
                    <span className="material-symbols-outlined">filter_list</span>
                </button>

                {/* Desktop Filters (always visible) */}
                <div className="hidden sm:flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 ml-1 mb-1">Date Range</label>
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl px-4 py-2 border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-sm mr-2">calendar_today</span>
                            <input
                                className="bg-transparent border-none text-xs font-bold p-0 focus:ring-0 text-text-main dark:text-white w-[160px]"
                                type="text"
                                defaultValue="Oct 01 - Oct 31, 2024"
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 ml-1 mb-1">Account Type</label>
                        <select
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] rounded-xl text-xs font-bold py-2 pl-4 pr-10 focus:ring-0 text-text-main dark:text-white"
                            value={accountType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            <option value="all">All Accounts</option>
                            <option value="assets">Assets</option>
                            <option value="liabilities">Liabilities</option>
                            <option value="equity">Equity</option>
                            <option value="revenue">Revenue</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>

                    <button className="bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 p-3 rounded-xl transition-all self-end border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                        <span className="material-symbols-outlined">filter_list</span>
                    </button>
                </div>
            </div>

            {/* Mobile Expanded Filters */}
            {showFilters && (
                <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)] grid grid-cols-2 gap-3">
                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 ml-1 mb-1">Date Range</label>
                        <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl px-3 py-2.5 border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
                            <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-sm mr-1.5">calendar_today</span>
                            <input
                                className="bg-transparent border-none text-[10px] font-bold p-0 focus:ring-0 text-text-main dark:text-white w-full"
                                type="text"
                                defaultValue="Oct 01 - Oct 31"
                                readOnly
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[9px] uppercase font-bold tracking-widest text-gray-400 dark:text-gray-500 ml-1 mb-1">Account Type</label>
                        <select
                            className="bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] rounded-xl text-[10px] font-bold py-2.5 pl-3 pr-8 focus:ring-0 text-text-main dark:text-white"
                            value={accountType}
                            onChange={(e) => handleTypeChange(e.target.value)}
                        >
                            <option value="all">All Accounts</option>
                            <option value="assets">Assets</option>
                            <option value="liabilities">Liabilities</option>
                            <option value="equity">Equity</option>
                            <option value="revenue">Revenue</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                </div>
            )}
        </section>
    );
};

export default LedgerFilters;
