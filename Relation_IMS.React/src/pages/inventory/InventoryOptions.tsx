import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

const InventoryOptions = () => {
    const { t } = useLanguage();
    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
           

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{t.inventory.overview}</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base max-w-2xl">
                        {t.inventory.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        <span className="hidden sm:inline">{t.inventory.exportReport || 'Export Report'}</span>
                        <span className="sm:hidden">{t.common.exportCSV || 'Export'}</span>
                    </button>
                </div>
            </div>

            {/* Grid Options */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <Link to="/inventory/locations" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-primary/50 transition-all">
                    <div className="p-3 rounded-full bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">inventory_2</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.locations}</h3>
                </Link>

                <Link to="/inventory/stock-in" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-blue-600/50 transition-all">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">input</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.stockIn}</h3>
                </Link>

                <Link to="/inventory/transfer" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-purple-600/50 transition-all">
                    <div className="p-3 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">local_shipping</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.transfer}</h3>
                </Link>

                <Link to="/inventory/history" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-orange-600/50 transition-all">
                    <div className="p-3 rounded-full bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">history</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.movementHistory}</h3>
                </Link>

                <Link to="/inventory/defects" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-gray-600/50 transition-all">
                    <div className="p-3 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">production_quantity_limits</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.defects}</h3>
                </Link>

                <Link to="/inventory/customer-return" className="group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-pink-600/50 transition-all">
                    <div className="p-3 rounded-full bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">keyboard_return</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.customerReturn}</h3>
                </Link>

                <Link to="/inventory/audit-logs" className="col-span-2 md:col-span-1 group flex flex-col items-center justify-center gap-3 p-4 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] hover:shadow-md hover:border-teal-600/50 transition-all">
                    <div className="p-3 rounded-full bg-teal-50 text-teal-600 dark:bg-teal-900/20 dark:text-teal-400 group-hover:scale-110 transition-transform duration-300">
                        <span className="material-symbols-outlined text-3xl">plagiarism</span>
                    </div>
                    <h3 className="text-sm md:text-lg font-bold text-text-main dark:text-white text-center">{t.inventory.auditLogs || 'Audit Logs'}</h3>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="mt-2">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">{t.inventory.recentActivity || 'Recent Inventory Activity'}</h3>
                    <Link to="/inventory/history" className="text-sm font-bold text-primary hover:text-green-600 transition-colors">{t.inventory.viewAllHistory || 'View All History'}</Link>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[var(--color-surface-dark-border)] shadow-sm bg-white dark:bg-[var(--color-surface-dark-card)]">
                    <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:text-gray-400">
                            <tr>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.date || 'Date'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.product || 'Product'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.action || 'Action'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.quantity || 'Qty Change'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.status || 'Status'}</th>
                                <th scope="col" className="px-6 py-4 font-bold">{t.common.user || 'User'}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">{t.common.today || 'Today'}, 10:30 AM</td>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Eco Slim Denim</td>
                                <td className="px-6 py-4">{t.inventory.stockAdjustment || 'Stock Adjustment'}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        - 2 {t.common.units || 'units'}
                                    </span>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">{t.common.completed || 'Completed'}</span></td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCcgJutYVkdH5Tp-5X1xHpHcS1DPWGQ5DCQ_saGZ-5RL8Rj94NVRLAtM1t3EycPMGs5wPf2scUOU6e2244oeqaYA0fKehRvI6gSafQuldruWSZUgCrtiDfDPxyuqin1nCeVB4OcNACc6ps26RR8pqrrxjIagSJElVGKTA8BN9xL0yHuJSjKMgBLPqiU5iDnbi2Kfh07rNRI_Yo2RHkyqzaQ8H1SDwXma1h1og_C2fMwYSXgDVZrQ2xIK7yMhj4WDC1iDO_2CrXdfXQ")' }}></div>
                                    <span>Mike R.</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">{t.common.yesterday || 'Yesterday'}, 04:15 PM</td>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Organic Cotton Crew</td>
                                <td className="px-6 py-4">{t.inventory.stockIn || 'Stock In'}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        + 50 {t.common.units || 'units'}
                                    </span>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">{t.common.completed || 'Completed'}</span></td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVHvUWv8FoNYC_Q25jJewzxm5jV5oZaY2MCpqASBfWEQa5ib4axRzE-3WRbpegDwCJKbpraVaQpcD44k_cdXw3oHSNto6JQkb2OnAiZBIAOYfCvzU66sUdUrHZg4hnleUWrMYhNjixs3NWWPHlaEWX_w9RlY1flCD9Ml6hpIloPdBqTr6-ZiBNps5Jn4D0j1ArOXIiYfGp100w-1zdzoaGhaYiHqbN6dyzzlj78a0n5CN06cHlnisnMCLb9HODxJ5LmbYZw46_DLg")' }}></div>
                                    <span>Sarah L.</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">Oct 23, 09:00 AM</td>
                                <td className="px-6 py-4 font-medium text-text-main dark:text-white">Hemp Canvas Jacket</td>
                                <td className="px-6 py-4">{t.inventory.auditCount || 'Audit / Count'}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700/50 dark:text-gray-300">
                                        0 {t.common.units || 'units'}
                                    </span>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">{t.inventory.verified || 'Verified'}</span></td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDO-ilIiA4Rr1242zdurXkorNnlFiAu-2PcPkcO0sPIj5JVKxb_4rvIzWV2teD_s2wNamtsCCxWhpQt-zIi2PJDFoPHGPf9jR8pAjCW5ac5-A0fyFONmX3ApPQInicVAFivqSJ8aqRrzpQ50_VEojz-KS68BjgLqiJNYZQSNLkoqLIsvZfvTsqVMHdlcYDAv6gXjEI4AeqBHWNJZzZt7JHHsWOvesjcDJX1J1Ql2GQ4Hvw4rgkmw9jK6M0pkLBfmHrFESjA2mRWHC8")' }}></div>
                                    <span>System</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryOptions;
