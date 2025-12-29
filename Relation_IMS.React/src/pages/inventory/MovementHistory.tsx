import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import type { MovementLog } from '../../types/inventory';
import { getInventoryMovementHistory } from '../../services/InventoryService';

const MovementHistory = () => {
    const [logs, setLogs] = useState<MovementLog[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Filters
    const [dateFilter, setDateFilter] = useState('');
    const [sourceFilter, setSourceFilter] = useState('');
    const [destinationFilter, setDestinationFilter] = useState('');
    const [userFilter, setUserFilter] = useState(''); // Assuming user ID input or select if IDs known

    // Effect to trigger search reload
    useEffect(() => {
        loadLogs(true);
    }, [debouncedSearch, dateFilter, sourceFilter, destinationFilter, userFilter]);

    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 0.1 });

    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    useEffect(() => {
        if (page > 1) {
            loadLogs(false);
        }
    }, [page]);

    const loadLogs = async (reset: boolean) => {
        if (reset) {
            setLogs([]);
            setPage(1);
            setHasMore(true);
        }

        setLoading(true);
        try {
            const currentPage = reset ? 1 : page;
            const records = await getInventoryMovementHistory({
                pageNumber: currentPage,
                pageSize: 20,
                search: debouncedSearch,
                date: dateFilter || undefined,
                // Validating if inputs are numbers for IDs, otherwise sending undefined
                // In a real app, these selects would likely return IDs directly
                // sourceId: sourceFilter ? parseInt(sourceFilter) : undefined,
                // destinationId: destinationFilter ? parseInt(destinationFilter) : undefined,
                // userId: userFilter ? parseInt(userFilter) : undefined,
            });

            if (!records || records.length === 0) {
                if (reset) setLogs([]);
                setHasMore(false);
                setLoading(false);
                return;
            }

            // Flatten the response logic: API returns records (groups of items), UI expects linear logs (one row per item)
            // Or UI could handle grouped logs. Current UI design implies one row per "movement".
            // Since API returns items grouped by transfer record, we need to flatten this.

            const flattenedLogs: MovementLog[] = records.flatMap(record => {
                return record.Items.map(item => ({
                    Id: record.Id * 1000 + item.ProductVariantId, // Composite ID for key
                    Date: record.Date,
                    ProductName: item.ProductName,
                    ProductSku: item.ProductSku,
                    ProductImage: item.ProductImageUrl || '', // Fallback image
                    SourceLocation: record.SourceInventoryName,
                    DestinationLocation: record.DestinationInventoryName,
                    Quantity: item.Quantity,
                    User: record.UserName,
                    UserAvatar: record.UserAvatarUrl || '',
                    ActionType: 'Transfer'
                }));
            });

            if (reset) {
                setLogs(flattenedLogs);
            } else {
                setLogs(prev => [...prev, ...flattenedLogs]);
            }

            if (records.length < 20) {
                setHasMore(false);
            }

        } catch (error) {
            console.error('Failed to load logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Decorative Background Elements */}
            <div className="fixed inset-0 bg-pattern -z-20 pointer-events-none"></div>
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-3xl"></div>
            </div>

            {/* Header */}
            <header className="w-full px-6 py-5 md:px-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 z-10">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                        <Link to="/inventory">Inventory</Link>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        <span>History</span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-[#0e1b12] dark:text-white tracking-tight">Movement History</h1>
                    <p className="text-[#4e9767] text-base font-medium max-w-2xl">Track the flow of inventory between warehouses and storefronts with real-time logs.</p>
                </div>
                <button className="flex items-center justify-center gap-2 bg-white dark:bg-[#1e2e23] hover:bg-[#e7f3eb] dark:hover:bg-[#2a3f31] border border-[#d0e7d7] dark:border-white/10 text-[#0e1b12] dark:text-white h-10 px-4 rounded-lg shadow-sm transition-all text-sm font-bold">
                    <span className="material-symbols-outlined text-[20px]">download</span>
                    <span>Export CSV</span>
                </button>
            </header>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 z-10">
                {/* Filter Section */}
                <section className="glass-panel rounded-2xl p-5 mb-6 shadow-sm">
                    <div className="flex flex-col gap-4">
                        {/* Top Row: Search */}
                        <div className="w-full">
                            <label className="flex flex-col w-full">
                                <div className="flex w-full items-center rounded-lg h-12 bg-white/50 dark:bg-black/20 border border-[#d0e7d7] dark:border-white/10 focus-within:ring-2 focus-within:ring-primary/50 transition-all overflow-hidden">
                                    <div className="text-[#4e9767] pl-4 flex items-center justify-center">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input
                                        className="flex w-full flex-1 bg-transparent border-none h-full placeholder:text-[#4e9767]/70 px-4 text-base font-normal focus:ring-0 text-[#0e1b12] dark:text-white"
                                        placeholder="Search SKU, Product Name, or User..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </label>
                        </div>
                        {/* Bottom Row: Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-[#4e9767] uppercase tracking-wider">Date Range</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[#d0e7d7] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary"
                                        type="date"
                                        value={dateFilter}
                                        onChange={(e) => setDateFilter(e.target.value)}
                                    />
                                </div>
                            </label>
                            {/* Detailed filters (Source/Dest/User) would require fetching available options. Keeping simple for now or accepting IDs if known. */}
                            {/* Placeholder selects for visual completeness, logic simplified for MVP */}
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-[#4e9767] uppercase tracking-wider">Source</span>
                                <select
                                    className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[#d0e7d7] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2317cf54%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-8"
                                    value={sourceFilter}
                                    onChange={(e) => setSourceFilter(e.target.value)}
                                >
                                    <option value="">All Locations</option>
                                    {/* Populate dynamically if inventory list available */}
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-[#4e9767] uppercase tracking-wider">Destination</span>
                                <select
                                    className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[#d0e7d7] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2317cf54%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-8"
                                    value={destinationFilter}
                                    onChange={(e) => setDestinationFilter(e.target.value)}
                                >
                                    <option value="">All Locations</option>
                                </select>
                            </label>
                            <label className="flex flex-col gap-1.5">
                                <span className="text-xs font-bold text-[#4e9767] uppercase tracking-wider">User</span>
                                <select
                                    className="w-full h-11 rounded-lg bg-white/50 dark:bg-black/20 border border-[#d0e7d7] dark:border-white/10 text-sm px-3 text-[#0e1b12] dark:text-white focus:ring-1 focus:ring-primary focus:border-primary appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2317cf54%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:12px_12px] bg-[right_1rem_center] bg-no-repeat pr-8"
                                    value={userFilter}
                                    onChange={(e) => setUserFilter(e.target.value)}
                                >
                                    <option value="">All Users</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </section>

                {/* Table Section */}
                <section className="glass-panel rounded-2xl shadow-sm overflow-hidden flex flex-col">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5 border-b border-[#d0e7d7] dark:border-white/5 text-xs uppercase text-[#4e9767] font-bold tracking-wider">
                                    <th className="px-6 py-4">Date &amp; Time</th>
                                    <th className="px-6 py-4">Product</th>
                                    <th className="px-6 py-4">Movement Route</th>
                                    <th className="px-6 py-4 text-center">Quantity</th>
                                    <th className="px-6 py-4">Transferred By</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#d0e7d7]/50 dark:divide-white/5">
                                {logs.map((log) => (
                                    <tr key={`${log.Id}-${log.ProductSku}`} className="group hover:bg-white/40 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[#0e1b12] dark:text-white">
                                                    {new Date(log.Date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(log.Date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden border border-gray-200">
                                                    {log.ProductImage ? (
                                                        <img className="w-full h-full object-cover" alt={log.ProductName} src={log.ProductImage} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-xs text-gray-500">No Img</div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#0e1b12] dark:text-white">{log.ProductName}</span>
                                                    <span className="text-xs text-[#4e9767] font-medium bg-primary/10 px-1.5 py-0.5 rounded w-fit">{log.ProductSku}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30">
                                                    <span className="size-2 rounded-full bg-orange-400"></span>
                                                    <span className="text-xs font-semibold text-orange-700 dark:text-orange-300">{log.SourceLocation}</span>
                                                </div>
                                                <span className="material-symbols-outlined text-gray-400 text-sm">arrow_forward</span>
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30">
                                                    <span className="size-2 rounded-full bg-blue-400"></span>
                                                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">{log.DestinationLocation}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-black ${log.Quantity >= 0 ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                                                {log.Quantity >= 0 ? `+${log.Quantity}` : log.Quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {log.UserAvatar ? (
                                                    <img className="size-8 rounded-full object-cover border border-white dark:border-white/10 shadow-sm" alt={log.User} src={log.UserAvatar} />
                                                ) : (
                                                    <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500 border border-white dark:border-white/10 shadow-sm">
                                                        {log.User.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{log.User}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-400 hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Sentinel */}
                    <div ref={containerRef} className="p-8 border-t border-[#d0e7d7]/50 dark:border-white/5 flex flex-col items-center justify-center bg-primary/5 min-h-[100px]">
                        {loading && (
                            <div className="flex items-center gap-3 text-primary animate-pulse">
                                <span className="material-symbols-outlined animate-spin shadow-primary/20 drop-shadow-sm">progress_activity</span>
                                <span className="text-sm font-bold tracking-tight">Fetching inventory logs...</span>
                            </div>
                        )}
                        {!hasMore && logs.length > 0 && (
                            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-600">
                                <span className="material-symbols-outlined text-3xl opacity-50">inventory</span>
                                <p className="text-xs font-bold uppercase tracking-widest">End of History</p>
                            </div>
                        )}
                        {!loading && logs.length === 0 && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="size-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined text-4xl">search_off</span>
                                </div>
                                <p className="text-[#4e9767] font-medium tracking-tight">No movement records found.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MovementHistory;
