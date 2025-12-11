import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function Layout() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-background-light dark:bg-background-dark font-display text-text-main antialiased selection:bg-primary/30">
            {/* Sidebar (Desktop & Mobile) */}
            <Sidebar
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
            />

            <main className="flex-1 flex flex-col h-full overflow-y-auto relative">
                {/* Mobile Header */}
                <div className="lg:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1a2e22] border-b border-gray-200 dark:border-[#2a4032] sticky top-0 z-20">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                            <span className="material-symbols-outlined text-text-main dark:text-white">menu</span>
                        </button>
                        <span className="font-bold text-text-main dark:text-white">EcoWear</span>
                    </div>
                    <div className="size-8 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://ui-avatars.com/api/?name=Jane+Doe&background=random")' }}></div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
