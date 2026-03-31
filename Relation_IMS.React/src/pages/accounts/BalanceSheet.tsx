import BalanceSheetHeader from '../../components/accounts/BalanceSheetHeader';
import BalanceSheetSectionCard from '../../components/accounts/BalanceSheetSectionCard';
import BalanceSheetTotalCard from '../../components/accounts/BalanceSheetTotalCard';
import {
    currentAssets,
    fixedAssets,
    currentLiabilities,
    longTermLiabilities,
    shareholderEquity,
    balanceSheetTotals,
} from './mockData';

const BalanceSheet = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12">
            {/* Header with Validation Badge */}
            <BalanceSheetHeader
                isBalanced={balanceSheetTotals.isBalanced}
                asOfDate={balanceSheetTotals.asOfDate}
            />

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 items-start">

                {/* Column 1: Assets */}
                <section className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 mb-1 sm:mb-2">
                        <div className="w-1 h-5 sm:h-6 bg-primary rounded-full"></div>
                        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">TOTAL ASSETS</h2>
                    </div>

                    <BalanceSheetSectionCard section={currentAssets} />
                    <BalanceSheetSectionCard section={fixedAssets} />

                    {/* Assets Grand Total */}
                    <BalanceSheetTotalCard
                        label="Grand Total Assets"
                        amount={balanceSheetTotals.totalAssets}
                        icon="account_balance_wallet"
                        variant="dark"
                    />
                </section>

                {/* Column 2: Liabilities & Equity */}
                <section className="flex flex-col gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 mb-1 sm:mb-2">
                        <div className="w-1 h-5 sm:h-6 bg-secondary rounded-full"></div>
                        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">LIABILITIES & EQUITY</h2>
                    </div>

                    <BalanceSheetSectionCard section={currentLiabilities} />
                    <BalanceSheetSectionCard section={longTermLiabilities} />
                    <BalanceSheetSectionCard section={shareholderEquity} />

                    {/* Liabilities & Equity Grand Total */}
                    <BalanceSheetTotalCard
                        label="Total Liabilities & Equity"
                        amount={balanceSheetTotals.totalLiabilitiesEquity}
                        icon="scale"
                        variant="light"
                    />
                </section>
            </div>
        </div>
    );
};

export default BalanceSheet;
