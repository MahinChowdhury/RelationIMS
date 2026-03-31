interface BalanceSheetHeaderProps {
    isBalanced: boolean;
    asOfDate: string;
}

const BalanceSheetHeader = ({ isBalanced, asOfDate }: BalanceSheetHeaderProps) => {
    return (
        <header className="mb-8 lg:mb-12 flex flex-col gap-4 sm:gap-6">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 lg:gap-6">
                <div>
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary">Financial Statement</span>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter mt-1 sm:mt-2 text-text-main dark:text-white">Balance Sheet</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-xs sm:text-sm max-w-md">
                        Comprehensive snapshot of the boutique's architectural assets, current liabilities, and shareholder equity as of {asOfDate}.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Validation Badge */}
                    <div className="flex items-center gap-3 sm:gap-4 bg-gray-50 dark:bg-white/5 px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-primary/20">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</span>
                            <span className="text-primary font-bold tracking-tight text-sm">{isBalanced ? 'Statement Balanced' : 'Unbalanced'}</span>
                        </div>
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                {isBalanced ? 'verified' : 'warning'}
                            </span>
                        </div>
                    </div>

                    {/* Print Button */}
                    <button className="hidden sm:flex items-center justify-center w-12 h-12 bg-gray-900 dark:bg-white/10 text-white rounded-xl shadow-lg hover:scale-105 transition-transform group">
                        <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">print</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default BalanceSheetHeader;
