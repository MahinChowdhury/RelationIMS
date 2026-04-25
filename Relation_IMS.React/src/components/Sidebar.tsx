import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useState, useRef, useEffect } from 'react';
import LogoutConfirmModal from './LogoutConfirmModal';
import ShareCatalogModal from './ShareCatalogModal';
import AccountsConfirmModal from './AccountsConfirmModal';
import { getTenantConfig } from '../services/tenantTheme';
import { getTenant } from '../services/authService';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user, logout } = useAuth();
    const { newOrderCount, newArrangementCount } = useNotifications();

    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showShareCatalog, setShowShareCatalog] = useState(false);
    const [showAccountsConfirm, setShowAccountsConfirm] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const tenantConfig = getTenantConfig(getTenant());

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    interface NavItem {
        name: string;
        path: string;
        icon: string;
        filled?: boolean;
    }

    const navItems: NavItem[] = [
        { name: t.nav.dashboard, path: '/dashboard', icon: 'dashboard' },
        { name: t.nav.products, path: '/products', icon: 'shopping_bag' },
        { name: t.nav.orders, path: '/orders', icon: 'receipt_long' },
        { name: t.nav.arrangement, path: '/arrangement', icon: 'conveyor_belt' },
        { name: t.nav.customers, path: '/customers', icon: 'group' },
        { name: t.nav.inventory, path: '/inventory', icon: 'inventory_2' },
        { name: t.nav.accounts, path: '/accounts', icon: 'bar_chart' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                />
            )}

            <aside className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[var(--color-surface-dark-card)] border-r border-gray-200 dark:border-[var(--color-surface-dark-border)] flex flex-col transition-transform duration-300 ease-in-out
                lg:static lg:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex h-full flex-col justify-between p-4">
                    <div className="flex flex-col gap-6">
                        {/* Logo Section */}
                        <div className="flex items-center gap-3 px-2">
                            <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0 bg-primary/20 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">eco</span>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-text-main dark:text-white text-base font-bold leading-normal">{tenantConfig.displayName}</h1>
                                <p className="text-text-secondary text-xs font-normal">{tenantConfig.subtitle}</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex flex-col gap-1">
                            {navItems.map((item) => {
                                if (item.path === '/accounts') {
                                    return (
                                        <button
                                            key={item.path}
                                            onClick={() => setShowAccountsConfirm(true)}
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
                                            <span className={`text-sm ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
                                                {item.name}
                                            </span>
                                        </button>
                                    );
                                }
                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive(item.path)
                                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                                            : 'text-text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        <span
                                            className={`material-symbols-outlined ${isActive(item.path) ? '' : 'text-gray-500 group-hover:text-primary dark:text-gray-400'
                                                }`}
                                            style={item.filled ? { fontVariationSettings: "'FILL' 1" } : {}}
                                        >
                                            {item.icon}
                                        </span>
                                        <span className={`text-sm ${isActive(item.path) ? 'font-bold' : 'font-medium'}`}>
                                            {item.name}
                                        </span>
                                        {item.path === '/orders' && newOrderCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {newOrderCount}
                                            </span>
                                        )}
                                        {item.path === '/arrangement' && newArrangementCount > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                {newArrangementCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)] pt-4">
                        <Link
                            to="/users"
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/users')
                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shadow-sm'
                                : 'text-text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined ${isActive('/users') ? '' : 'text-gray-500 group-hover:text-primary dark:text-gray-400'
                                    }`}
                                style={isActive('/users') ? { fontVariationSettings: "'FILL' 1" } : {}}
                            >
                                manage_accounts
                            </span>
                            <span className={`text-sm ${isActive('/users') ? 'font-bold' : 'font-medium'}`}>{t.nav.userManagement}</span>
                        </Link>

                        <Link
                            to="/configuration"
                            onClick={onClose}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive('/configuration')
                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary shadow-sm'
                                : 'text-text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                        >
                            <span
                                className={`material-symbols-outlined ${isActive('/configuration') ? '' : 'text-gray-500 group-hover:text-primary dark:text-gray-400'
                                    }`}
                            >
                                tune
                            </span>
                            <span className={`text-sm ${isActive('/configuration') ? 'font-bold' : 'font-medium'}`}>{t.nav.configuration}</span>
                        </Link>

                        {/* User Profile Component */}
                        <div className="relative mt-2" ref={profileMenuRef}>
                            <div className="w-full flex items-center justify-between gap-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group">
                                <Link
                                    to="/userprofile"
                                    onClick={onClose}
                                    className="flex-1 flex items-center gap-3 px-3 py-2.5 overflow-hidden"
                                    title="View Profile"
                                >
                                    <div className="size-8 rounded-full bg-primary/20 shrink-0 flex items-center justify-center text-primary font-bold group-hover:bg-primary/30 transition-colors">
                                        {user?.Firstname?.charAt(0) || 'U'}
                                    </div>
                                    <div className="flex flex-col text-left truncate">
                                        <p className="text-sm font-bold text-text-main dark:text-white truncate">
                                            {user ? `${user.Firstname} ${user.Lastname || ''}`.trim() : 'User User'}
                                        </p>
                                        <p className="text-xs text-text-secondary truncate">
                                            {user?.Roles?.length ? user.Roles.join(', ') : 'Role'}
                                        </p>
                                    </div>
                                </Link>
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="px-2 py-2.5 text-gray-500 hover:text-primary transition-colors focus:outline-none"
                                    aria-label="Toggle profile menu"
                                >
                                    <span className={`material-symbols-outlined text-[20px] transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`}>
                                        expand_more
                                    </span>
                                </button>
                            </div>

                            {/* Profile Menu Popup */}
                            {isProfileMenuOpen && (
                                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                                    
                                    <Link
                                        to="/userprofile"
                                        onClick={() => { setIsProfileMenuOpen(false); if (onClose) onClose(); }}
                                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] text-gray-400">person</span>
                                        View Profile
                                    </Link>
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); setShowShareCatalog(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px] text-gray-400">share</span>
                                        Share Catalog
                                    </button>
                                    <button
                                        onClick={() => { setIsProfileMenuOpen(false); setShowLogoutConfirm(true); }}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">logout</span>
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>

            <LogoutConfirmModal
                show={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={logout}
            />

            <ShareCatalogModal
                show={showShareCatalog}
                onClose={() => setShowShareCatalog(false)}
            />

            {/* Accounts Confirmation Modal */}
            <AccountsConfirmModal
                show={showAccountsConfirm}
                onCancel={() => setShowAccountsConfirm(false)}
                onConfirm={() => {
                    setShowAccountsConfirm(false);
                    if (onClose) onClose();
                    navigate('/accounts');
                }}
            />
        </>
    );
};

export default Sidebar;
