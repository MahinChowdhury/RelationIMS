import { Outlet } from 'react-router-dom';
import AccountsSidebar from '../../components/accounts/AccountsSidebar';
import AccountsBottomNav from '../../components/accounts/AccountsBottomNav';

export default function AccountsLayout() {
    return (
        <div className="flex min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display text-text-main antialiased selection:bg-primary/30 relative">
            {/* Background Elements (Dark Mode Only) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none hidden dark:block">
                <div className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-primary/20 rounded-full filter blur-[100px] opacity-50 animate-pulse"></div>
            </div>

            {/* Accounts Sidebar (Desktop Only) */}
            <div className="hidden lg:flex sticky top-0 h-[100dvh]">
                <AccountsSidebar />
            </div>

            <main className="flex-1 flex flex-col min-h-[100dvh] relative bg-background-light dark:bg-background-dark w-full max-w-full lg:ml-64">
                {/* Spacer for notch */}
                <div className="shrink-0 w-full lg:hidden" style={{ height: 'env(safe-area-inset-top)' }} />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-max pb-32 lg:pb-0">
                    <Outlet />
                </div>
            </main>

            {/* Accounts Bottom Nav (Mobile Only) */}
            <AccountsBottomNav />
        </div>
    );
}
