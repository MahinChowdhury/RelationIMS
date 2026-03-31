const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface BalanceSheetTotalCardProps {
    label: string;
    amount: number;
    icon: string;
    variant: 'dark' | 'light';
}

const BalanceSheetTotalCard = ({ label, amount, icon, variant }: BalanceSheetTotalCardProps) => {
    if (variant === 'dark') {
        return (
            <div className="bg-gray-900 dark:bg-white/10 p-5 sm:p-8 rounded-xl flex justify-between items-center text-white mt-2 sm:mt-4 shadow-xl shadow-primary/5">
                <div>
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-60">{label}</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{formatCurrency(amount)}</p>
                </div>
                <span className="material-symbols-outlined text-3xl sm:text-4xl opacity-20">{icon}</span>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 dark:bg-white/5 p-5 sm:p-8 rounded-xl flex justify-between items-center text-text-main dark:text-white mt-2 sm:mt-4 border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
            <div>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] opacity-60">{label}</p>
                <p className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight mt-1">{formatCurrency(amount)}</p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                <span className="material-symbols-outlined text-xl sm:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            </div>
        </div>
    );
};

export default BalanceSheetTotalCard;
