import SalesHeader from '../../components/accounts/SalesHeader';
import MetricsOverview from '../../components/accounts/MetricsOverview';
import MonthlySalesTable from '../../components/accounts/MonthlySalesTable';
import IncomeMixChart from '../../components/accounts/IncomeMixChart';
import TopCustomersList from '../../components/accounts/TopCustomersList';
import {
    salesMetrics,
    monthlySalesData,
    incomeMixData,
    topCustomersData,
    salesTotals,
} from './mockData';

const SalesSummary = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-10 pb-8 sm:pb-10 lg:pb-12">
            {/* Header */}
            <SalesHeader
                title="Sales & Income Summary"
                subtitle="Enterprise Resource Planning"
                description={`Detailed fiscal performance analysis for the Q1-Q2 cycle. Validated on June 15, ${new Date().getFullYear()}.`}
            />

            {/* Metrics Overview Bento Grid */}
            <MetricsOverview
                totalGrossRevenue={salesMetrics.totalGrossRevenue}
                revenueChange={salesMetrics.revenueChange}
                netIncomeMargin={salesMetrics.netIncomeMargin}
                marginTarget={salesMetrics.marginTarget}
                returnsClaims={salesMetrics.returnsClaims}
                returnsPercent={salesMetrics.returnsPercent}
                topRegion={salesMetrics.topRegion}
                topRegionUnits={salesMetrics.topRegionUnits}
            />

            {/* Monthly Sales Breakdown Table */}
            <MonthlySalesTable data={monthlySalesData} totals={salesTotals} />

            {/* Secondary Analysis: Income Mix & Top Customers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                <IncomeMixChart data={incomeMixData} />
                <TopCustomersList data={topCustomersData} />
            </div>
        </div>
    );
};

export default SalesSummary;
