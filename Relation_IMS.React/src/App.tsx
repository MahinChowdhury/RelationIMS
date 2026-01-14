import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Products from './pages/products/Products';
import Customers from './pages/customers/Customers';
import CustomerDetails from './pages/customers/CustomerDetails';
import ProductDetails from './pages/products/ProductDetails';

import Orders from './pages/orders/Orders';
import OrderDetails from './pages/orders/OrderDetails';
import CreateOrder from './pages/orders/CreateOrder';

import InventoryOptions from './pages/inventory/InventoryOptions';
import InventoryTransfer from './pages/inventory/InventoryTransfer';
import DefectItems from './pages/inventory/DefectItems';
import InventoryLocations from './pages/inventory/InventoryLocations';
import InventoryDetails from './pages/inventory/InventoryDetails';
import StockIn from './pages/inventory/StockIn';
import MovementHistory from './pages/inventory/MovementHistory';
import Welcome from './pages/Welcome';
import Configuration from './pages/configuration/Configuration';

// Placeholder components
const Dashboard = () => <div className="p-4">Dashboard Page Coming Soon</div>;
const Accounts = () => <div className="p-4">Accounts Page Coming Soon</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="welcome" element={<Welcome />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/create" element={<CreateOrder />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="inventory" element={<InventoryOptions />} />
        <Route path="inventory/transfer" element={<InventoryTransfer />} />
        <Route path="inventory/defects" element={<DefectItems />} />
        <Route path="inventory/locations" element={<InventoryLocations />} />
        <Route path="inventory/locations/:id" element={<InventoryDetails />} />
        <Route path="inventory/stock-in" element={<StockIn />} />
        <Route path="inventory/history" element={<MovementHistory />} />
        <Route path="configuration" element={<Configuration />} />
        {/* Deep link support for products */}
        <Route path="products/:id" element={<ProductDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
