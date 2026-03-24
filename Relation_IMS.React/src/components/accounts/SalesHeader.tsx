interface SalesHeaderProps {
    title: string;
    subtitle: string;
    description: string;
}

const SalesHeader = ({ title, subtitle, description }: SalesHeaderProps) => {
    return (
        <header className="mb-8 lg:mb-12 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
            <div>
                <span className="uppercase tracking-widest text-[10px] font-extrabold text-primary mb-2 block">{subtitle}</span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tighter text-text-main dark:text-white leading-none">{title}</h1>
                <p className="mt-3 sm:mt-4 text-gray-500 dark:text-gray-400 max-w-xl font-medium text-sm">{description}</p>
            </div>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                <button className="bg-gray-900 dark:bg-white/10 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center gap-2 hover:bg-black dark:hover:bg-white/20 transition-all">
                    <span className="material-symbols-outlined text-sm">download</span>
                    <span className="hidden sm:inline">Export PDF</span>
                    <span className="sm:hidden">PDF</span>
                </button>
                <button className="bg-primary text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm tracking-tight flex items-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90 transition-all">
                    <span className="material-symbols-outlined text-sm">refresh</span>
                    <span className="hidden sm:inline">Re-Calculate</span>
                    <span className="sm:hidden">Refresh</span>
                </button>
            </div>
        </header>
    );
};

export default SalesHeader;
