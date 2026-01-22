import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useState } from 'react';
import GlobalSearch from './GlobalSearch';

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileProfile, setShowMobileProfile] = useState(true);

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
                <div className={`lg:hidden fixed top-4 right-4 z-50 transition-opacity duration-300 ${showMobileProfile ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="size-10 rounded-full bg-gray-200 bg-center bg-cover shadow-sm border-2 border-white dark:border-[#1a2e22]" style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Jane+Doe&background=random")' }}></div>
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
