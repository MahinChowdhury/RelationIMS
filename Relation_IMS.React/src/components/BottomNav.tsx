import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useState } from 'react';
import api from '../services/api';
import BarcodeScanner from './BarcodeScanner';

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [isScanning, setIsScanning] = useState(false);

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    const handleScan = async (barcode: string) => {
        try {
            const res = await api.get(`/ProductItem/code/${barcode.trim()}`);
            if (res.data && res.data.ProductId) {
                navigate(`/products/${res.data.ProductId}`);
            } else {
                alert('Product not found');
            }
        } catch (err) {
            alert('Product not found');
        }
        setIsScanning(false);
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 glass-nav px-1 pt-3 pb-8 flex items-center justify-between z-50 lg:hidden"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
            <NavLink
                to="/dashboard"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/dashboard') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    grid_view
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.dashboard}
                </span>
            </NavLink>

            <NavLink
                to="/products"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/products') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    shopping_bag
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/products') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.products}
                </span>
            </NavLink>

            <NavLink
                to="/orders"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/orders') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    receipt_long
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/orders') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.orders}
                </span>
            </NavLink>

            <div className="relative -top-6 flex-shrink-0 mx-0.5">
                <button
                    onClick={() => setIsScanning(true)}
                    className="size-12 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(23,207,84,0.3)] hover:bg-primary-hover active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl font-light">qr_code_scanner</span>
                </button>
            </div>

            <NavLink
                to="/customers"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/customers') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    group
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/customers') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.customers}
                </span>
            </NavLink>

            <NavLink
                to="/inventory"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/inventory') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    inventory_2
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/inventory') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.inventory}
                </span>
            </NavLink>

            <NavLink
                to="/accounts"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/accounts') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    leaderboard
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/accounts') ? 'text-primary' : 'text-text-secondary'}`}>
                    {t.nav.accounts}
                </span>
            </NavLink>
        </nav>

        {isScanning && (
            <BarcodeScanner
                enabled={isScanning}
                onScanned={handleScan}
                onClose={() => setIsScanning(false)}
            />
        )}
        </>
    );
}
