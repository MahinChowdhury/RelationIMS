import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getTenantConfig } from '../../services/tenantTheme';
import { getTenant } from '../../services/authService';

const AccountsSidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const tenantConfig = getTenantConfig(getTenant());

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const navItems = [
        { name: 'Cash Book', path: '/accounts/cashbook', icon: 'payments' },
        { name: 'Sales Summary', path: '/accounts/sales', icon: 'analytics' },
        { name: 'General Ledger', path: '/accounts/ledger', icon: 'menu_book' },
        { name: 'Balance Sheet', path: '/accounts/balance-sheet', icon: 'account_balance' },
        { name: 'Profit & Loss', path: '/accounts/profit-loss', icon: 'trending_up' },
    ];

    return (
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[var(--color-surface-dark-card)] border-r border-gray-200 dark:border-[var(--color-surface-dark-border)] flex flex-col">
            <div className="flex flex-col gap-6 p-4">
                {/* Logo / Brand Section */}
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0 bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">eco</span>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-text-main dark:text-white text-base font-bold leading-normal">{tenantConfig.displayName}</h1>
                        <p className="text-text-secondary text-xs font-normal">{tenantConfig.subtitle}</p>
                    </div>
                </div>

                {/* Section Header */}
                <div className="px-2">
                    <h2 className="uppercase tracking-widest text-[10px] font-extrabold text-gray-400 dark:text-gray-500">Accounting</h2>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">Fiscal Year {new Date().getFullYear()}</p>
                </div>

                {/* Navigation Links */}
                <div className="flex flex-col gap-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive(item.path)
                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                                : 'text-text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined ${isActive(item.path) ? '' : 'text-gray-500 group-hover:text-primary dark:text-gray-400'
                                    }`}
                            >
                                {item.icon}
                            </span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${isActive(item.path) ? '' : ''}`}>
                                {item.name}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Sidebar Footer: Go back to IMS */}
            <div className="mt-auto p-4 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="w-full flex items-center gap-3 text-gray-600 dark:text-gray-300 px-4 py-3 bg-gray-100/70 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-all rounded-xl"
                >
                    <span className="material-symbols-outlined">logout</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest">Go back to IMS</span>
                </button>
            </div>
        </aside>
    );
};

export default AccountsSidebar;
