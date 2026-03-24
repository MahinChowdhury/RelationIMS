const CashBookFooter = () => {
    return (
        <footer className="mt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex gap-4 mb-4 md:mb-0">
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary"></span> Live Reconciled
                </span>
                <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600"></span> Pending Review
                </span>
            </div>
            <div className="flex gap-6">
                <button className="hover:text-primary transition-colors">Audit Logs</button>
                <button className="hover:text-primary transition-colors">Export Ledger</button>
                <button className="hover:text-primary transition-colors">Integrations</button>
            </div>
        </footer>
    );
};

export default CashBookFooter;
