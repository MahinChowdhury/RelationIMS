import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export default function BottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 glass-nav px-1 pt-3 pb-8 flex items-center justify-between z-50 lg:hidden">
            <NavLink
                to="/dashboard"
                className={({ isActive }) => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/dashboard') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    grid_view
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/dashboard') ? 'text-primary' : 'text-text-secondary'}`}>
                    Dashboard
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
                    Products
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
                    Orders
                </span>
            </NavLink>

            <div className="relative -top-6 flex-shrink-0 mx-0.5">
                <button
                    onClick={() => navigate('/orders/create')}
                    className="size-12 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(23,207,84,0.3)] hover:bg-primary-hover active:scale-90 transition-all"
                >
                    <span className="material-symbols-outlined text-2xl font-light">add</span>
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
                    Customers
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
                    Inventory
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
                    Accounts
                </span>
            </NavLink>
        </nav>
    );
}
