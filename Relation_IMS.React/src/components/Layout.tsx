import { Outlet, Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import { useState, useRef, useEffect } from 'react';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import ShareCatalogModal from './ShareCatalogModal';

export default function Layout() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [showMobileProfile, setShowMobileProfile] = useState(true);
    const [isMobileProfileMenuOpen, setIsMobileProfileMenuOpen] = useState(false);
    const [showShareCatalog, setShowShareCatalog] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [showAccountsConfirm, setShowAccountsConfirm] = useState(false);
    const mobileProfileRef = useRef<HTMLDivElement>(null);
    const mainRef = useRef<HTMLElement>(null);
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

    useEffect(() => {
        const handleWindowScroll = () => {
            setShowMobileProfile(window.scrollY < 50);
        };
        window.addEventListener('scroll', handleWindowScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleWindowScroll);
    }, []);

    return (
        <div className="flex min-h-[100dvh] w-full bg-background-light dark:bg-background-dark font-display text-text-main antialiased selection:bg-primary/30 relative">
            {/* Background Elements (Dark Mode Only) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none hidden dark:block">
                <div className="absolute -top-1/4 -left-1/4 w-[60%] h-[60%] bg-primary/20 rounded-full filter blur-[100px] opacity-50 animate-pulse"></div>
            </div>

            {/* Global Search Bar */}
            <GlobalSearch />

            {/* Sidebar (Desktop Only) */}
            <div className="hidden lg:flex sticky top-0 h-[100dvh]">
                <Sidebar
                    isOpen={mobileMenuOpen}
                    onClose={() => setMobileMenuOpen(false)}
                />
            </div>

            <main
                ref={mainRef}
                className="flex-1 flex flex-col min-h-[100dvh] relative lg:pt-0 bg-background-light dark:bg-background-dark w-full max-w-full"
            >
                {/* Spacer for notch so content starts below notch but scrolls under it */}
                <div className="shrink-0 w-full" style={{ height: 'env(safe-area-inset-top)' }} />

                {/* Mobile Profile Circle (Scroll Aware) */}
                <div
                    ref={mobileProfileRef}
                    className={`lg:hidden fixed right-4 z-50 transition-opacity duration-300 ${showMobileProfile ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{ top: 'calc(1rem + env(safe-area-inset-top))' }}
                >
                    <button
                        onClick={() => setIsMobileProfileMenuOpen(!isMobileProfileMenuOpen)}
                        className="size-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white dark:border-[#1a2e22] active:scale-95 transition-transform"
                    >
                        {user?.Firstname?.charAt(0) || 'U'}
                    </button>

                    {/* Mobile Profile Menu Popup */}
                    {isMobileProfileMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50 animate-in fade-in zoom-in duration-200 origin-top-right">
                            <div className="px-4 py-2 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)]">
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
                            <Link
                                to="/users"
                                onClick={() => setIsMobileProfileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-400">manage_accounts</span>
                                {t.nav.userManagement}
                            </Link>
                            <button
                                onClick={() => { setIsMobileProfileMenuOpen(false); setShowAccountsConfirm(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-400">leaderboard</span>
                                {t.nav.accounts}
                            </button>
                            <button
                                onClick={() => { setIsMobileProfileMenuOpen(false); setShowShareCatalog(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px] text-gray-400">share</span>
                                Share Catalog
                            </button>
                            
                            <button
                                onClick={() => { setIsMobileProfileMenuOpen(false); setShowLogoutModal(true); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[20px]">logout</span>
                                {t.profile.logout || 'Logout'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-max pb-32 lg:pb-0">
                    <Outlet />
                </div>
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav />

            <ShareCatalogModal
                show={showShareCatalog}
                onClose={() => setShowShareCatalog(false)}
            />

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-red-500 text-[24px]">logout</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-text-main dark:text-white">{t.profile.logout || 'Logout'}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{t.common.areYouSure || 'Are you sure?'}</p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                            {t.profile.logoutConfirmation || 'Are you sure you want to logout?'}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutModal(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors font-medium"
                            >
                                {t.common.cancel || 'Cancel'}
                            </button>
                            <button
                                onClick={() => { setShowLogoutModal(false); logout(); }}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                                {t.common.yes || 'Yes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Accounts Confirmation Modal */}
            {showAccountsConfirm && (
                <div className="fixed inset-0 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn p-4 md:p-0 pt-4 md:pt-0">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-3xl shadow-2xl p-8 w-[90%] max-w-md border-2 border-[var(--color-scrollbar)] dark:border-[var(--color-surface-dark-border)] transform transition-all">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center">
                                <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-[#0e1b12] dark:text-white text-xl font-black">{t.nav.accounts}</h2>
                                <p className="text-secondary text-sm">{t.common.areYouSure}</p>
                            </div>
                        </div>
                        <p className="text-[#0e1b12] dark:text-gray-300 text-base mb-6 leading-relaxed">
                            {t.common.accountsConfirmation}
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowAccountsConfirm(false)}
                                className="px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                            >
                                {t.common.cancel}
                            </button>
                            <button
                                onClick={() => { setShowAccountsConfirm(false); setIsMobileProfileMenuOpen(false); navigate('/accounts'); }}
                                className="px-4 py-2.5 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary/90 shadow-md shadow-primary/20 transition-all"
                            >
                                {t.common.goToAccounts}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
