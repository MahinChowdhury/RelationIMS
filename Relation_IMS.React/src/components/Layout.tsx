import { Outlet, Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useState, useRef, useEffect } from 'react';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileProfile, setShowMobileProfile] = useState(true);
    const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
    const mobileProfileRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (mobileProfileRef.current && !mobileProfileRef.current.contains(event.target as Node)) {
                setIsMobileProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollTop = e.currentTarget.scrollTop;
        setShowMobileProfile(scrollTop < 50);
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-text-main antialiased selection:bg-primary/30">
            {/* Global Search Bar */}
            <GlobalSearch />

            {/* Sidebar (Desktop Only) */}
            <div className="hidden lg:flex h-full">
                <Sidebar
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />
            </div>

            <main
                className="flex-1 flex flex-col h-full overflow-y-auto relative pb-24 lg:pb-0"
                onScroll={handleScroll}
            >
                {/* Mobile Profile Circle (Scroll Aware) */}
                <div
                    ref={mobileProfileRef}
                    className={`lg:hidden fixed top-4 right-4 z-50 transition-opacity duration-300 ${showMobileProfile ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                >
                    <button
                        onClick={() => setIsMobileProfileMenuOpen(!isMobileProfileMenuOpen)}
                        className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white dark:border-[#1a2e22] active:scale-95 transition-transform"
                    >
                        {user?.Firstname?.charAt(0) || 'U'}
                    </button>

                    {/* Mobile Profile Menu Popup */}
                    {isMobileProfileMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[#203326] border border-gray-100 dark:border-[#2a4032] rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-[#2a4032]">
                                <p className="text-sm font-bold text-text-main dark:text-white truncate">
                                    {user?.Firstname} {user?.Lastname}
                                </p>
                                <p className="text-xs text-text-secondary truncate">
                                    {user?.Roles?.join(', ')}
                                </p>
                            </div>
                            <Link
                                to="/userprofile"
                                onClick={() => setIsMobileProfileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-400">person</span>
                                View Profile
                            </Link>
                            <button
                                onClick={() => { setIsMobileProfileMenuOpen(false); logout(); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                Logout
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav />
        </div>
    );
}
