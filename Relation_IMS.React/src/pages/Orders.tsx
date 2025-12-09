import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import useDebounce from '../hooks/useDebounce';
import { type Order, PaymentStatus } from '../types';

export default function OrdersPage() {
    const navigate = useNavigate();

    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [filtered, setFiltered] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [sortBy, setSortBy] = useState<'date' | 'amount' | ''>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');

    // Infinite Scroll
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    // Initial Load & Infinite Scroll
    useEffect(() => {
        loadOrders(page === 1);
    }, [page]);

    // Apply filters locally when data or filters change
    useEffect(() => {
        applyFilters();
    }, [orders, debouncedSearch, sortBy, filterStatus]);

    // Trigger reload on filters
    useEffect(() => {
        // Reset and load
        loadOrders(true);
    }, [debouncedSearch, filterStatus, sortBy]);

    // Infinite Scroll trigger
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    const loadOrders = async (reset: boolean) => {
        setLoading(true);
        try {
            const p = reset ? 1 : page;
            if (reset) setPage(1);

            const res = await api.get<{ data: Order[] } | Order[]>(`/Order?pageNumber=${p}&pageSize=${pageSize}`);
            // Handle different API response structures if needed (Products used res.data directly or array)
            const data = Array.isArray(res.data) ? res.data : (res.data as any)?.data || [];

            setOrders(prev => {
                const current = reset ? [] : prev;
                // De-dupe
                const existingIds = new Set(current.map(o => o.Id));
                const unique = data.filter((o: Order) => !existingIds.has(o.Id));
                return [...current, ...unique];
            });

            if (data.length < pageSize) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (error) {
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };


    const applyFilters = () => {
        let list = [...orders];

        // Search
        if (debouncedSearch) {
            const term = debouncedSearch.toLowerCase().trim();
            list = list.filter(order =>
                order.Id.toString().includes(term) ||
                order.CustomerId.toString().includes(term) ||
                order.Customer?.Name?.toLowerCase().includes(term) ||
                order.Customer?.Phone?.includes(term) ||
                order.Customer?.Email?.toLowerCase().includes(term)
            );
        }

        // Status
        if (filterStatus === 'paid') {
            list = list.filter(o => o.PaymentStatus === PaymentStatus.Paid);
        } else if (filterStatus === 'pending') {
            list = list.filter(o => o.PaymentStatus === PaymentStatus.Pending);
        }

        // Sort
        if (sortBy === 'date') {
            list.sort((a, b) => {
                const dateA = new Date(a.CreatedAt).getTime();
                const dateB = new Date(b.CreatedAt).getTime();
                return dateB - dateA;
            });
        } else if (sortBy === 'amount') {
            list.sort((a, b) => b.NetAmount - a.NetAmount);
        }

        setFiltered(list);
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getPaymentStatusText = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Pending: return 'Pending';
            case PaymentStatus.Partial: return 'Partial';
            case PaymentStatus.Paid: return 'Paid';
            default: return 'Unknown';
        }
    };

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-40 flex flex-1 justify-center py-5 bg-gradient-to-br from-[#f8fcf9] to-white min-h-screen">
            <div className="layout-content-container flex flex-col w-full max-w-none flex-1">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 p-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[#0e1b12] text-3xl md:text-4xl font-black leading-tight tracking-tight">Order Management</p>
                            <p className="text-[#4e9767] text-sm font-medium mt-1">Track and manage all customer orders</p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="px-4 py-3">
                    <label className="flex flex-col min-w-40 h-14 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-2xl h-full shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-[#4e9767] flex border-none bg-white items-center justify-center pl-5 rounded-l-2xl border-r-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256">
                                    <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path>
                                </svg>
                            </div>
                            <input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by Order ID or Customer ID..."
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-2xl text-[#0e1b12] focus:outline-0 focus:ring-2 focus:ring-[#4e9767] border-none bg-white focus:border-none h-full placeholder:text-[#4e9767]/60 px-5 rounded-l-none border-l-0 pl-3 text-base font-medium leading-normal"
                            />
                        </div>
                    </label>
                </div>

                {/* Filter Bar */}
                <div className="flex gap-3 p-3 flex-wrap pr-4">
                    <button
                        onClick={() => setSortBy(prev => prev === 'date' ? '' : 'date')}
                        className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <svg className="w-4 h-4 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Sort by Date
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"
                            className={sortBy === 'date' ? 'rotate-180' : ''}>
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => setSortBy(prev => prev === 'amount' ? '' : 'amount')}
                        className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <svg className="w-4 h-4 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Sort by Amount
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"
                            className={sortBy === 'amount' ? 'rotate-180' : ''}>
                            <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path>
                        </svg>
                    </button>

                    <button
                        onClick={() => setFilterStatus(prev => prev === 'all' ? 'paid' : prev === 'paid' ? 'pending' : 'all')}
                        className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                        <svg className="w-4 h-4 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                        </svg>
                        {filterStatus === 'all' ? 'All Status' : filterStatus === 'paid' ? 'Paid Only' : 'Pending Only'}
                    </button>
                </div>

                {/* Table / Cards */}
                <div className="px-4 py-3">
                    {/* Desktop Table (Hidden on mobile) */}
                    <div className="hidden md:block bg-white rounded-2xl shadow-xl border-2 border-[#d0e7d7] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white">
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Order ID</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Customer</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Date</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Total</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Discount</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Net Amount</th>
                                    <th className="px-4 py-4 text-left text-sm font-bold leading-normal uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-4 text-right text-sm font-bold leading-normal uppercase tracking-wide">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white">
                                {filtered.map((order) => (
                                    <tr key={order.Id} className="border-b border-[#d0e7d7] hover:bg-[#e7ede7] transition-colors">
                                        <td className="h-[72px] px-4 py-2 text-[#0e1b12] text-sm font-semibold leading-normal">
                                            #{order.Id}
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm font-normal leading-normal">
                                            <Link to={`/customers/${order.CustomerId}`} className="hover:underline hover:text-[#0e1b12] font-medium">
                                                {order.Customer?.Name || `Customer #${order.CustomerId}`}
                                            </Link>
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm font-normal leading-normal">
                                            {formatDate(order.CreatedAt)}
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-[#0e1b12] text-sm font-normal leading-normal">
                                            ৳{order.TotalAmount.toFixed(2)}
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-[#4e9767] text-sm font-normal leading-normal">
                                            ৳{order.Discount.toFixed(2)}
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-[#0e1b12] text-sm font-semibold leading-normal">
                                            ৳{order.NetAmount.toFixed(2)}
                                        </td>
                                        <td className="h-[72px] px-4 py-2">
                                            <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-medium 
                                                ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-800' :
                                                    order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {getPaymentStatusText(order.PaymentStatus)}
                                            </span>
                                        </td>
                                        <td className="h-[72px] px-4 py-2 text-right">
                                            <button
                                                onClick={() => navigate(`/orders/${order.Id}`)}
                                                className="p-2 rounded-lg bg-[#e7f3eb] text-[#4e9767] hover:bg-[#d0e7d7] transition-all"
                                                title="View Details"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden flex flex-col gap-4">
                        {filtered.map((order) => (
                            <div key={order.Id} className="bg-white rounded-2xl shadow-lg border-2 border-[#d0e7d7] p-4 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-[#0e1b12] text-lg font-bold">#{order.Id}</h3>
                                        <p className="text-[#4e9767] text-sm">
                                            <Link to={`/customers/${order.CustomerId}`} className="hover:underline font-medium">
                                                Customer #{order.CustomerId}
                                            </Link>
                                        </p>
                                    </div>
                                    <span className={`inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-medium
                                        ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-800' :
                                            order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'}`}>
                                        {getPaymentStatusText(order.PaymentStatus)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="font-medium text-[#4e9767]">Date</span>
                                        <span className="text-[#0e1b12]">{formatDate(order.CreatedAt)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-[#4e9767]">Total</span>
                                        <span className="text-[#0e1b12]">৳{order.TotalAmount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-[#4e9767]">Discount</span>
                                        <span className="text-[#0e1b12]">৳{order.Discount.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-medium text-[#4e9767]">Net Amount</span>
                                        <span className="text-[#0e1b12] font-semibold">৳{order.NetAmount.toFixed(2)}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => navigate(`/orders/${order.Id}`)}
                                    className="w-full mt-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white text-sm font-bold transition-all shadow-md hover:shadow-lg"
                                >
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Infinite Scroll Anchor */}
                    <div ref={containerRef} className="flex flex-col items-center justify-center py-8 mt-8">
                        {loading && (
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin"></div>
                                <p className="text-[#4e9767] text-base font-semibold">Loading more orders...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
