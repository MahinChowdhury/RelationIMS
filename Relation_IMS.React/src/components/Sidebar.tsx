import { Link, useLocation } from 'react-router-dom';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };

    const navItems = [
        { name: 'Dashboard', path: '/dashboard', icon: 'dashboard' },
        { name: 'Products', path: '/products', icon: 'shopping_bag' },
        { name: 'Orders', path: '/orders', icon: 'receipt_long' },
        { name: 'Customers', path: '/customers', icon: 'group' },
        { name: 'Inventory', path: '/inventory', icon: 'inventory_2', filled: true },
        { name: 'Reports', path: '/reports', icon: 'bar_chart' },
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
                fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-[#1a2e22] border-r border-gray-200 dark:border-[#2a4032] flex flex-col transition-transform duration-300 ease-in-out
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
                                <h1 className="text-text-main dark:text-white text-base font-bold leading-normal">Relation IMS</h1>
                                <p className="text-text-secondary text-xs font-normal">Inventory Manager</p>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <div className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose} // Close sidebar on mobile when link clicked
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
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col gap-1 border-t border-gray-100 dark:border-[#2a4032] pt-4">
                        <Link
                            to="/settings"
                            onClick={onClose}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-main dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors group"
                        >
                            <span className="material-symbols-outlined text-gray-500 group-hover:text-primary dark:text-gray-400">
                                settings
                            </span>
                            <span className="text-sm font-medium">Settings</span>
                        </Link>

                        <div className="flex items-center gap-3 px-3 py-2.5 mt-2">
                            <div className="size-8 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Jane+Doe&background=random")' }}></div>
                            <div className="flex flex-col">
                                <p className="text-sm font-bold text-text-main dark:text-white">Jane Doe</p>
                                <p className="text-xs text-text-secondary">Stock Manager</p>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
