import LedgerHeader from '../../components/accounts/LedgerHeader';
import LedgerSummaryCards from '../../components/accounts/LedgerSummaryCards';
import LedgerFilters from '../../components/accounts/LedgerFilters';
import LedgerTable from '../../components/accounts/LedgerTable';
import LedgerStatus from '../../components/accounts/LedgerStatus';
import {
    ledgerSummary,
    ledgerEntries,
    ledgerPeriodTotals,
} from './mockData';

const GeneralLedger = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12">
            {/* Header with Breadcrumbs & Actions */}
            <LedgerHeader />

            {/* Summary Bento Grid */}
            <LedgerSummaryCards summary={ledgerSummary} />

            {/* Filters Section */}
            <LedgerFilters />

            {/* High-Density Ledger Table */}
            <LedgerTable entries={ledgerEntries} totals={ledgerPeriodTotals} />

            {/* Ledger Status & Reconciliation */}
            <LedgerStatus
                period="October 2024"
                lastReconciliation="Today at 09:42 AM"
                isBalanced={true}
            />
        </div>
    );
};

export default GeneralLedger;
