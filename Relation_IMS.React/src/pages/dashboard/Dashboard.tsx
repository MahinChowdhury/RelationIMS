import SalesOverview from '../../components/dashboard/SalesOverview';
import TopSellingProducts from '../../components/dashboard/TopSellingProducts';
import LowStockAlerts from '../../components/dashboard/LowStockAlerts';
import RevenueByCategory from '../../components/dashboard/RevenueByCategory';
import MonthlyGrowthTrend from '../../components/dashboard/MonthlyGrowthTrend';
import PaymentMethods from '../../components/dashboard/PaymentMethods';
import StaffPerformance from '../../components/dashboard/StaffPerformance';
import CustomerInsights from '../../components/dashboard/CustomerInsights';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import SalesByCategory from '../../components/dashboard/SalesByCategory';
import TopCustomers from '../../components/dashboard/TopCustomers';
import ProfitAnalysis from '../../components/dashboard/ProfitAnalysis';

const Dashboard = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 lg:space-y-10">
      {/* Sales Overview (Hero Section) */}
      <SalesOverview />

      {/* Second Row: Top Selling Products + Low Stock Alerts */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <TopSellingProducts />
        <LowStockAlerts />
      </div>

      {/* Third Row: Revenue by Category + Monthly Growth */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <RevenueByCategory />
        <MonthlyGrowthTrend />
      </div>

      {/* Fourth Row: Payment Methods + Staff Performance + Customer Insights */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <PaymentMethods />
        <StaffPerformance />
        <CustomerInsights />
      </div>

      {/* Fifth Row: Recent Transactions + Sales by Category */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6">
        <RecentTransactions />
        <SalesByCategory />
      </div>

      {/* Sixth Row: Top Customers + Profit Analysis */}
      <div className="grid grid-cols-12 gap-4 sm:gap-6 pb-6 sm:pb-8 lg:pb-12">
        <TopCustomers />
        <ProfitAnalysis />
      </div>
    </div>
  );
};

export default Dashboard;
