import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ShareCatalogView from './pages/products/ShareCatalogView';
import { applyTenantTheme } from './services/tenantTheme';
import { getTenant } from './services/authService';

// Apply tenant theme immediately on load
applyTenantTheme(getTenant());

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const Products = lazy(() => import('./pages/products/Products'));
const ProductDetails = lazy(() => import('./pages/products/ProductDetails'));
const Customers = lazy(() => import('./pages/customers/Customers'));
const CustomerDetails = lazy(() => import('./pages/customers/CustomerDetails'));
const Orders = lazy(() => import('./pages/orders/Orders'));
const OrderDetails = lazy(() => import('./pages/orders/OrderDetails'));
const CreateOrder = lazy(() => import('./pages/orders/CreateOrder'));
const Invoice = lazy(() => import('./pages/orders/Invoice'));
const InventoryOptions = lazy(() => import('./pages/inventory/InventoryOptions'));
const InventoryTransfer = lazy(() => import('./pages/inventory/InventoryTransfer'));
const DefectItems = lazy(() => import('./pages/inventory/DefectItems'));
const CustomerReturn = lazy(() => import('./pages/inventory/CustomerReturn'));
const InventoryLocations = lazy(() => import('./pages/inventory/InventoryLocations'));
const InventoryDetails = lazy(() => import('./pages/inventory/InventoryDetails'));
const StockIn = lazy(() => import('./pages/inventory/StockIn'));
const MovementHistory = lazy(() => import('./pages/inventory/MovementHistory'));
const Welcome = lazy(() => import('./pages/Welcome'));
const Configuration = lazy(() => import('./pages/configuration/Configuration'));
const Arrangement = lazy(() => import('./pages/arrangement/Arrangement'));
const ArrangementDetails = lazy(() => import('./pages/arrangement/ArrangementDetails'));
const UserProfile = lazy(() => import('./pages/userprofile/UserProfile'));
const UserManagement = lazy(() => import('./pages/users/UserManagement'));
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'));

// Accounts section (separate layout with its own sidebar/bottom-nav)
const AccountsLayout = lazy(() => import('./pages/accounts/AccountsLayout'));
const SalesSummary = lazy(() => import('./pages/accounts/SalesSummary'));
const CashBook = lazy(() => import('./pages/accounts/CashBook'));
const GeneralLedger = lazy(() => import('./pages/accounts/GeneralLedger'));
const BalanceSheet = lazy(() => import('./pages/accounts/BalanceSheet'));
const ProfitLoss = lazy(() => import('./pages/accounts/ProfitLoss'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products/share-catalog/:hash" element={<ShareCatalogView />} />
        <Route path="/products/share-catalog/:hash/:productId" element={<ProductDetails isGuestView={true} />} />

        {/* Main IMS Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Welcome />} />
          <Route path="welcome" element={<Welcome />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/create" element={<CreateOrder />} />
          <Route path="orders/edit/:id" element={<CreateOrder />} />
          <Route path="orders/:id" element={<OrderDetails />} />
          <Route path="orders/:id/invoice" element={<Invoice />} />
          <Route path="customers" element={<Customers />} />
          <Route path="customers/:id" element={<CustomerDetails />} />
          <Route path="inventory" element={<InventoryOptions />} />
          <Route path="inventory/transfer" element={<InventoryTransfer />} />
          <Route path="inventory/defects" element={<DefectItems />} />
          <Route path="inventory/customer-return" element={<CustomerReturn />} />
          <Route path="inventory/locations" element={<InventoryLocations />} />
          <Route path="inventory/locations/:id" element={<InventoryDetails />} />
          <Route path="inventory/stock-in" element={<StockIn />} />
          <Route path="inventory/history" element={<MovementHistory />} />
          <Route path="configuration" element={<Configuration />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="arrangement" element={<Arrangement />} />
          <Route path="arrangement/:id" element={<ArrangementDetails />} />
          <Route path="userprofile/:id?" element={<UserProfile />} />
          <Route path="products/:id" element={<ProductDetails />} />
        </Route>

        {/* Accounts Section (separate layout with its own sidebar/bottom-nav) */}
        <Route path="/accounts" element={<ProtectedRoute><AccountsLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/accounts/sales" replace />} />
          <Route path="sales" element={<SalesSummary />} />
          <Route path="cashbook" element={<CashBook />} />
          <Route path="ledger" element={<GeneralLedger />} />
          <Route path="balance-sheet" element={<BalanceSheet />} />
          <Route path="profit-loss" element={<ProfitLoss />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
