interface ProfitLossHeaderProps {
    onExportPDF?: () => void;
    onPrintReport?: () => void;
}

const ProfitLossHeader = ({ onExportPDF, onPrintReport }: ProfitLossHeaderProps) => {
    return (
        <header className="mb-8 lg:mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
                <nav className="flex items-center gap-2 text-xs font-bold tracking-widest text-primary uppercase mb-2">
                    <span>Fiscal Year 2024</span>
                    <span className="w-1 h-1 bg-primary rounded-full"></span>
                    <span>Q3 Summary</span>
                </nav>
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tighter text-text-main dark:text-white leading-none">Profit & Loss Statement</h2>
                <p className="mt-3 lg:mt-4 text-gray-500 dark:text-gray-400 max-w-xl font-medium text-sm">
                    Detailed financial performance review for Eco-Architect Boutique. Consolidated reporting for the period July 1st – September 30th, 2024.
                </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <button 
                    onClick={onExportPDF}
                    className="flex-1 md:flex-none bg-gray-900 dark:bg-white/10 text-white px-4 lg:px-6 py-2.5 lg:py-3 text-xs lg:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-gray-900/10 dark:shadow-white/5 transition-transform active:scale-95 hover:bg-black dark:hover:bg-white/20"
                >
                    <span className="material-symbols-outlined text-sm" data-icon="download">download</span>
                    <span>Export PDF</span>
                </button>
                <button 
                    onClick={onPrintReport}
                    className="flex-1 md:flex-none hidden sm:block bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-[var(--color-surface-dark-border)] text-gray-700 dark:text-gray-300 px-4 lg:px-6 py-2.5 lg:py-3 text-xs lg:text-sm font-bold rounded-xl transition-all hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95"
                >
                    Print Report
                </button>
            </div>
        </header>
    );
};

export default ProfitLossHeader;
