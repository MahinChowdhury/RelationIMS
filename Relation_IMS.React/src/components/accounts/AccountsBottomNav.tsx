import { NavLink, useLocation, useNavigate } from 'react-router-dom';

export default function AccountsBottomNav() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 glass-nav px-1 pt-3 pb-8 flex items-center justify-between z-50 lg:hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
            <NavLink
                to="/accounts/cashbook"
                className={() => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive('/accounts/cashbook') ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/accounts/cashbook') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    payments
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/accounts/cashbook') ? 'text-primary' : 'text-text-secondary'}`}>
                    Cash Book
                </span>
            </NavLink>

            <NavLink
                to="/accounts/sales"
                className={() => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive('/accounts/sales') ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/accounts/sales') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    analytics
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/accounts/sales') ? 'text-primary' : 'text-text-secondary'}`}>
                    Sales
                </span>
            </NavLink>

            {/* Center button - go back to IMS */}
            <div className="relative -top-6 flex-shrink-0 mx-0.5">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="size-12 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 rounded-full flex items-center justify-center shadow-lg hover:bg-gray-900 dark:hover:bg-white active:scale-90 transition-all"
                    title="Go back to IMS"
                >
                    <span className="material-symbols-outlined text-2xl font-light">arrow_back</span>
                </button>
            </div>

            <NavLink
                to="/accounts/balance-sheet"
                className={() => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive('/accounts/balance-sheet') ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/accounts/balance-sheet') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    account_balance
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/accounts/balance-sheet') ? 'text-primary' : 'text-text-secondary'}`}>
                    Balance
                </span>
            </NavLink>

            <NavLink
                to="/accounts/profit-loss"
                className={() => `flex flex-col items-center gap-1 flex-1 min-w-0 ${isActive('/accounts/profit-loss') ? '' : 'opacity-60'}`}
            >
                <span className={`material-symbols-outlined text-[24px] ${isActive('/accounts/profit-loss') ? 'active-icon text-primary' : 'text-text-secondary'}`}>
                    trending_up
                </span>
                <span className={`text-[9px] font-bold tracking-tight truncate w-full text-center ${isActive('/accounts/profit-loss') ? 'text-primary' : 'text-text-secondary'}`}>
                    P&L
                </span>
            </NavLink>
        </nav>
    );
}
