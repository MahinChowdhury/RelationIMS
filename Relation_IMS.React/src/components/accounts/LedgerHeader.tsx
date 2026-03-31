interface LedgerHeaderProps {
    onNewEntry?: () => void;
}

const LedgerHeader = ({ onNewEntry }: LedgerHeaderProps) => {
    return (
        <header className="mb-6 sm:mb-8 lg:mb-10 flex flex-col gap-4 sm:gap-6">
            {/* Breadcrumbs */}
            <nav className="flex text-[10px] sm:text-xs font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500">
                <span>Accounting</span>
                <span className="mx-2">/</span>
                <span className="text-primary">General Ledger</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-text-main dark:text-white">General Ledger</h1>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <button className="hidden sm:flex bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-tight hover:bg-gray-200 dark:hover:bg-white/10 transition-all items-center gap-2">
                        <span className="material-symbols-outlined text-sm">print</span>
                        Print
                    </button>
                    <button className="bg-gray-900 dark:bg-white/10 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-tight hover:bg-black dark:hover:bg-white/20 transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">download</span>
                        <span className="hidden sm:inline">Export PDF</span>
                        <span className="sm:hidden">PDF</span>
                    </button>
                    <button
                        onClick={onNewEntry}
                        className="bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold tracking-tight hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                        <span className="hidden sm:inline">New Entry</span>
                        <span className="sm:hidden">New</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default LedgerHeader;
