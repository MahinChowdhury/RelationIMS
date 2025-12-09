import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Products from './pages/Products';
import Customers from './pages/Customers';
import CustomerDetails from './pages/CustomerDetails';
import ProductDetails from './components/products/ProductDetails';

import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';

// Placeholder components
const Dashboard = () => <div className="p-4">Dashboard Page Coming Soon</div>;
const Reports = () => <div className="p-4">Reports Page Coming Soon</div>;
const Inventory = () => <div className="p-4">Inventory Page Coming Soon</div>;

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="reports" element={<Reports />} />
        <Route path="inventory" element={<Inventory />} />
        {/* Deep link support for products */}
        <Route path="products/:id" element={<ProductDetails />} />
      </Route>
    </Routes>
  );
}

export default App;
