interface CashBookHeaderProps {
    onExportPDF?: () => void;
    onNewEntry?: () => void;
    onTransferToHQ?: () => void;
    transferLabel?: string;
}

const CashBookHeader = ({ onExportPDF, onNewEntry, onTransferToHQ, transferLabel = 'Transfer to HQ' }: CashBookHeaderProps) => {
    return (
        <header className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
            <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white mb-1 sm:mb-2">Cash Book</h1>
                <p className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm">Daily transaction logging and liquid capital monitoring.</p>
            </div>
            
            <div className="flex gap-2 sm:gap-3 shrink-0">
                {onTransferToHQ && (
                    <button 
                        onClick={onTransferToHQ}
                        className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 dark:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-white/20 transition-all text-xs sm:text-sm border border-gray-700"
                    >
                        <span className="material-symbols-outlined text-sm">account_balance</span>
                        <span className="hidden sm:inline">{transferLabel}</span>
                        <span className="sm:hidden">Transfer</span>
                    </button>
                )}
                <button 
                    onClick={onExportPDF}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 dark:bg-white/10 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-black dark:hover:bg-white/20 transition-all text-xs sm:text-sm"
                >
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                </button>
                <button 
                    onClick={onNewEntry}
                    className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs sm:text-sm"
                >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span className="hidden sm:inline">New Entry</span>
                    <span className="sm:hidden">New</span>
                </button>
            </div>
        </header>
    );
};

export default CashBookHeader;
