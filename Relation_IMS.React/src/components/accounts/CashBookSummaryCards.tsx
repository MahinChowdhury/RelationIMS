import type { CashBookSummary } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

interface CashBookSummaryCardsProps {
    summary: CashBookSummary;
}

const CashBookSummaryCards = ({ summary }: CashBookSummaryCardsProps) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
            {/* Opening Balance */}
            <div className="bg-gray-50 dark:bg-white/5 p-4 sm:p-6 rounded-xl border-l-4 border-gray-300 dark:border-gray-600">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1 sm:mb-2">Opening Balance</p>
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main dark:text-white">{formatCurrency(summary.openingBalance)}</p>
                <div className="mt-2 sm:mt-4 flex items-center text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">
                    <span className="material-symbols-outlined text-[10px] sm:text-xs mr-1">calendar_today</span>
                    {summary.openingDate}
                </div>
            </div>

            {/* Total Cash In */}
            <div className="bg-gray-50 dark:bg-white/5 p-4 sm:p-6 rounded-xl border-l-4 border-primary">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1 sm:mb-2">Total Cash In</p>
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main dark:text-white">{formatCurrency(summary.totalCashIn)}</p>
                <div className="mt-2 sm:mt-4 flex items-center text-[10px] sm:text-xs text-primary/80">
                    <span className="material-symbols-outlined text-[10px] sm:text-xs mr-1">arrow_upward</span>
                    {summary.cashInChange}
                </div>
            </div>

            {/* Total Cash Out */}
            <div className="bg-gray-50 dark:bg-white/5 p-4 sm:p-6 rounded-xl border-l-4 border-gray-800 dark:border-gray-500">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-800 dark:text-gray-300 mb-1 sm:mb-2">Total Cash Out</p>
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main dark:text-white">{formatCurrency(summary.totalCashOut)}</p>
                <div className="mt-2 sm:mt-4 flex items-center text-[10px] sm:text-xs text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[10px] sm:text-xs mr-1">arrow_downward</span>
                    {summary.cashOutChange}
                </div>
            </div>

            {/* Closing Balance */}
            <div className="bg-gray-100 dark:bg-white/10 p-4 sm:p-6 rounded-xl border-l-4 border-primary col-span-2 md:col-span-1">
                <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-primary mb-1 sm:mb-2">Closing Balance</p>
                <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-text-main dark:text-white">{formatCurrency(summary.closingBalance)}</p>
                <div className={`mt-2 sm:mt-4 flex items-center text-[10px] sm:text-xs ${summary.reconciled ? 'text-primary' : 'text-error'}`}>
                    <span className="material-symbols-outlined text-[10px] sm:text-xs mr-1">
                        {summary.reconciled ? 'verified' : 'warning'}
                    </span>
                    {summary.reconciled ? 'Reconciled' : 'Pending Review'}
                </div>
            </div>
        </div>
    );
};

export default CashBookSummaryCards;
