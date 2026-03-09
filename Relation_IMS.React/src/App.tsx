import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import ShareCatalogView from './pages/products/ShareCatalogView';

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

const Dashboard = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Dashboard</h1>
    <p className="text-gray-600 mt-2">Coming Soon</p>
  </div>
);

const Accounts = () => (
  <div className="p-4">
    <h1 className="text-2xl font-bold">Accounts</h1>
    <p className="text-gray-600 mt-2">Coming Soon</p>
  </div>
);

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
          <Route path="accounts" element={<Accounts />} />
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
      </Routes>
    </Suspense>
  );
}

export default App;
