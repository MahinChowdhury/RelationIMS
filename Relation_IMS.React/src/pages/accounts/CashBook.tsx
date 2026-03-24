import CashBookHeader from '../../components/accounts/CashBookHeader';
import CashBookSummaryCards from '../../components/accounts/CashBookSummaryCards';
import CashBookTable from '../../components/accounts/CashBookTable';
import CashBookFooter from '../../components/accounts/CashBookFooter';
import {
    cashBookSummary,
    cashBookEntries,
    cashBookPeriodTotals,
} from './mockData';

const CashBook = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12 bg-white dark:bg-transparent min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Page Header */}
                <CashBookHeader />

                {/* Summary Bento Grid */}
                <CashBookSummaryCards summary={cashBookSummary} />

                {/* Transaction Table */}
                <CashBookTable entries={cashBookEntries} totals={cashBookPeriodTotals} />

                {/* Footer Legend / Links */}
                <CashBookFooter />
            </div>
        </div>
    );
};

export default CashBook;
