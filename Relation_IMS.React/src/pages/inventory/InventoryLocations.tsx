import { Link } from 'react-router-dom';

export default function InventoryLocations() {
    return (
        <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                            <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <Link to="/inventory" className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white">Inventory</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">Locations</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">Inventory Locations</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base max-w-2xl">
                        Manage your physical inventory locations and view stock distribution across warehouses and shops.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-600 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">add_location</span>
                        <span>Add Location</span>
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Card 1: Main Warehouse */}
                <div className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-primary/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="p-6 flex flex-col gap-5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-primary/10 text-primary">
                                    <span className="material-symbols-outlined text-3xl">warehouse</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Main Warehouse</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">Inventory-1 • HQ</p>
                                </div>
                            </div>
                            <div className="relative group/menu">
                                <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                    <span className="material-symbols-outlined">more_vert</span>
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Items</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">12,450</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Value</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">$245.8k</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <span className="text-sm font-medium text-text-secondary dark:text-gray-300">Operational</span>
                            </div>
                            <Link to="/inventory/locations/1" className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 2: Central Godown */}
                <div className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-orange-500/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="p-6 flex flex-col gap-5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400">
                                    <span className="material-symbols-outlined text-3xl">inventory</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Central Godown</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">Godown • Zone B</p>
                                </div>
                            </div>
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Items</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">8,320</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Value</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">$112.4k</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-2 py-1 bg-red-50 dark:bg-red-900/20 rounded text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30">
                                <span className="material-symbols-outlined text-[14px]">warning</span>
                                <span>15 Low Stock</span>
                            </div>
                            <Link to="/inventory/locations/2" className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 3: Downtown Shop */}
                <div className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-blue-500/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="p-6 flex flex-col gap-5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                                    <span className="material-symbols-outlined text-3xl">storefront</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Downtown Shop</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">Shop-1 • Retail</p>
                                </div>
                            </div>
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Items</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">1,850</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Value</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">$45.2k</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
                                <span className="text-sm font-medium text-text-secondary dark:text-gray-300">Open Now</span>
                            </div>
                            <Link to="/inventory/locations/3" className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 4: North Outlet */}
                <div className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-purple-500/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="p-6 flex flex-col gap-5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                                    <span className="material-symbols-outlined text-3xl">store</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">North Outlet</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">Shop-2 • Retail</p>
                                </div>
                            </div>
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Items</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">940</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Value</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">$18.6k</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-500 text-xs font-bold border border-yellow-100 dark:border-yellow-900/30">
                                <span className="material-symbols-outlined text-[14px]">info</span>
                                <span>Audit Due</span>
                            </div>
                            <Link to="/inventory/locations/4" className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Card 5: Returns Center */}
                <div className="group bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-lg hover:border-gray-500/50 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gray-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="p-6 flex flex-col gap-5 relative z-10">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                                    <span className="material-symbols-outlined text-3xl">assignment_return</span>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-text-main dark:text-white">Returns Center</h3>
                                    <p className="text-sm text-text-secondary dark:text-gray-400">Facility-R • Returns</p>
                                </div>
                            </div>
                            <button className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 transition-colors">
                                <span className="material-symbols-outlined">more_vert</span>
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed border-gray-100 dark:border-[#2a4032]">
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Total Items</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">125</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Pending</span>
                                <span className="text-xl font-bold text-text-main dark:text-white">42</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="flex h-2 w-2 rounded-full bg-gray-400"></span>
                                <span className="text-sm font-medium text-text-secondary dark:text-gray-300">Processing</span>
                            </div>
                            <Link to="/inventory/locations/5" className="text-sm font-bold text-primary hover:text-green-700 flex items-center gap-1 group-hover:gap-2 transition-all">
                                View Details <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Add New Location */}
                <Link to="#" className="group flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-[#2a4032] hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 h-full min-h-[240px]">
                    <div className="p-4 rounded-full bg-white dark:bg-[#1a2e22] text-gray-400 group-hover:text-primary shadow-sm group-hover:shadow-md transition-all">
                        <span className="material-symbols-outlined text-4xl">add</span>
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-bold text-text-main dark:text-white group-hover:text-primary transition-colors">Add New Location</h3>
                        <p className="text-sm text-text-secondary dark:text-gray-400 mt-1">Configure a new warehouse or shop</p>
                    </div>
                </Link>
            </div>

            {/* Recent Location Transfers */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-text-main dark:text-white">Recent Location Transfers</h3>
                    <Link to="#" className="text-sm font-bold text-primary hover:text-green-600 transition-colors">View All Transfers</Link>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-[#2a4032] shadow-sm bg-white dark:bg-[#1a2e22]">
                    <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                        <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[#112116] dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-4 font-bold" scope="col">Date</th>
                                <th className="px-6 py-4 font-bold" scope="col">From</th>
                                <th className="px-6 py-4 font-bold" scope="col">To</th>
                                <th className="px-6 py-4 font-bold" scope="col">Items</th>
                                <th className="px-6 py-4 font-bold" scope="col">Status</th>
                                <th className="px-6 py-4 font-bold" scope="col">User</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">Today, 11:20 AM</td>
                                <td className="px-6 py-4 font-medium">Main Warehouse</td>
                                <td className="px-6 py-4 font-medium">Downtown Shop</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-text-main dark:text-white">250 units</span> (Denim)
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded dark:bg-orange-900/30 dark:text-orange-400">In Transit</span></td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCcgJutYVkdH5Tp-5X1xHpHcS1DPWGQ5DCQ_saGZ-5RL8Rj94NVRLAtM1t3EycPMGs5wPf2scUOU6e2244oeqaYA0fKehRvI6gSafQuldruWSZUgCrtiDfDPxyuqin1nCeVB4OcNACc6ps26RR8pqrrxjIagSJElVGKTA8BN9xL0yHuJSjKMgBLPqiU5iDnbi2Kfh07rNRI_Yo2RHkyqzaQ8H1SDwXma1h1og_C2fMwYSXgDVZrQ2xIK7yMhj4WDC1iDO_2CrXdfXQ")' }}></div>
                                    <span>Mike R.</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">Yesterday, 02:45 PM</td>
                                <td className="px-6 py-4 font-medium">Central Godown</td>
                                <td className="px-6 py-4 font-medium">Main Warehouse</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-text-main dark:text-white">1,000 units</span> (Cotton T's)
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30 dark:text-green-400">Completed</span></td>
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <div className="size-6 rounded-full bg-gray-200 bg-center bg-cover" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCVHvUWv8FoNYC_Q25jJewzxm5jV5oZaY2MCpqASBfWEQa5ib4axRzE-3WRbpegDwCJKbpraVaQpcD44k_cdXw3oHSNto6JQkb2OnAiZBIAOYfCvzU66sUdUrHZg4hnleUWrMYhNjixs3NWWPHlaEWX_w9RlY1flCD9Ml6hpIloPdBqTr6-ZiBNps5Jn4D0j1ArOXIiYfGp100w-1zdzoaGhaYiHqbN6dyzzlj78a0n5CN06cHlnisnMCLb9HODxJ5LmbYZw46_DLg")' }}></div>
                                    <span>Sarah L.</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">Oct 24, 09:15 AM</td>
                                <td className="px-6 py-4 font-medium">North Outlet</td>
                                <td className="px-6 py-4 font-medium">Returns Center</td>
                                <td className="px-6 py-4">
                                    <span className="font-bold text-text-main dark:text-white">12 units</span> (Faulty)
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-400">Received</span></td>
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
}
