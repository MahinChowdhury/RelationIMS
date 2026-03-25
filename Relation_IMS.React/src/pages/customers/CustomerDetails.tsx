import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Customer, Order } from '../../types';

interface CustomerStats {
    totalPurchases: number;
    totalDue: number;
    lastOrderDate: string | null;
}

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const customerId = Number(id);
    const taka = '\u09F3';
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [stats, setStats] = useState<CustomerStats | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingFilters, setLoadingFilters] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Pagination & Filters
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [yearFilter, setYearFilter] = useState<string>('');

    const observer = useRef<IntersectionObserver | null>(null);
    const lastOrderElementRef = useCallback((node: HTMLTableRowElement | null) => {
        if (loadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loadingMore, hasMore]);

    useEffect(() => {
        if (!customerId || isNaN(customerId)) {
            setError('Invalid customer ID');
            setLoading(false);
            return;
        }
        loadInitialData();
    }, [customerId]);

    useEffect(() => {
        setPage(1);
        setOrders([]);
        setHasMore(true);
    }, [customerId, statusFilter, yearFilter]);

    useEffect(() => {
        if (!customerId || isNaN(customerId)) return;
        loadOrders(page === 1);
    }, [customerId, statusFilter, yearFilter, page]);

    const loadInitialData = async () => {
        try {
            setLoading(true);
            setError('');

            const [custRes, statsRes] = await Promise.all([
                api.get(`/Customer/${customerId}`),
                api.get(`/Customer/${customerId}/stats`)
            ]);

            setCustomer(custRes.data);
            setStats(statsRes.data);
        } catch (err: any) {
            console.error('Failed to load initial data:', err);
            setError(err.response?.data?.message || 'Failed to load customer data.');
        } finally {
            setLoading(false);
        }
    };

    const loadOrders = async (isFirstPage: boolean) => {
        try {
            if (isFirstPage) {
                setLoadingFilters(true);
            } else {
                setLoadingMore(true);
            }

            const queryParams = new URLSearchParams();
            if (statusFilter !== '') queryParams.append('status', statusFilter);
            if (yearFilter !== '') queryParams.append('year', yearFilter);
            queryParams.append('pageNumber', page.toString());
            queryParams.append('pageSize', '20');

            const ordRes = await api.get(`/Order/customer/${customerId}?${queryParams.toString()}`);
            const newOrders = ordRes.data || [];

            setHasMore(newOrders.length === 20);

            if (isFirstPage) {
                setOrders(newOrders);
            } else {
                setOrders(prev => [...prev, ...newOrders]);
            }
        } catch (err: any) {
            console.error('Failed to load orders:', err);
        } finally {
            setLoadingFilters(false);
            setLoadingMore(false);
        }
    };

    // --- Derived Logic ---
    const totalSpent = stats?.totalPurchases || 0;
    const totalDue = stats?.totalDue || 0;

    const lastOrderDate = stats?.lastOrderDate
        ? new Date(stats.lastOrderDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A';

    const formatDate = (dateString?: string) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const formatFullDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getPaymentStatusBadge = (status: number) => {
        switch (status) {
            case 2: // Paid
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        <span className="size-1.5 rounded-full bg-green-500"></span>
                        Paid
                    </span>
                );
            case 1: // Partial
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <span className="size-1.5 rounded-full bg-yellow-500"></span>
                        Partial
                    </span>
                );
            default: // Pending / Unknown
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400">
                        <span className="size-1.5 rounded-full bg-gray-500"></span>
                        Pending
                    </span>
                );
        }
    };

    const getCustomerStatus = () => {
        if (totalSpent > 2000) return 'VIP Customer';
        if (totalSpent > 500) return 'Loyal Customer';
        return 'Retail Customer';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary border-gray-200"></div>
                <p className="mt-4 text-primary text-lg font-medium">Loading details...</p>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="p-8 flex justify-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 flex items-center gap-3 h-fit shadow-sm">
                    <span className="material-symbols-outlined">error</span>
                    <span>{error || 'Customer not found'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">

            

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{customer.Name}</h1>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                            {getCustomerStatus()}
                        </span>
                    </div>
                    <p className="text-text-secondary dark:text-gray-400 text-base max-w-2xl">
                        Customer ID: #CUST-{customer.Id.toString().padStart(4, '0')} ¢â‚¬¢ Member since {formatDate(customer.CreatedDate)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-200 dark:hover:bg-white/5 transition-all shadow-sm">
                        <span className="material-symbols-outlined text-[20px]">edit</span>
                        Edit Profile
                    </button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Profile & Contact */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Profile Card */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] overflow-hidden">
                        <div className="relative h-32 w-full bg-gradient-to-r from-green-50 to-emerald-100 dark:from-[#112116] dark:to-[#1a2e22]"></div>
                        <div className="px-6 pb-6">
                            <div className="relative -mt-12 mb-4">
                                <div className="size-24 rounded-full border-4 border-white dark:border-[#1a2e22] shadow-sm bg-gray-200 bg-center bg-cover flex items-center justify-center text-3xl font-bold text-gray-400">
                                    {/* Placeholder if no image */}
                                    {customer.Name.substring(0, 2).toUpperCase()}
                                </div>
                            </div>
                            <h2 className="text-xl font-bold text-text-main dark:text-white">{customer.Name}</h2>
                            <p className="text-sm text-text-secondary dark:text-gray-400 mb-6">{getCustomerStatus()}</p>

                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg shadow-md shadow-primary/20 transition-all w-full">
                                    <span className="material-symbols-outlined text-[18px]">call</span>
                                    Call
                                </button>
                                <button className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5 transition-all w-full">
                                    <span className="material-symbols-outlined text-[18px]">mail</span>
                                    Message
                                </button>
                            </div>

                            <hr className="border-gray-100 dark:border-[var(--color-surface-dark-border)] mb-6" />

                            <div className="flex flex-col gap-4">

                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] text-gray-500">
                                        <span className="material-symbols-outlined text-[20px]">phone_iphone</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Phone Number</p>
                                        <p className="text-sm font-medium text-text-main dark:text-gray-200">{customer.Phone}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] text-gray-500">
                                        <span className="material-symbols-outlined text-[20px]">location_on</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Address</p>
                                        <p className="text-sm font-medium text-text-main dark:text-gray-200 break-words">
                                            {customer.Address}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] text-gray-500">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Shop Name</p>
                                        <p className="text-sm font-medium text-text-main dark:text-gray-200 truncate" title={customer.ShopName}>{customer.ShopName || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] text-gray-500">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </div>
                                    <div className="overflow-hidden">
                                        <p className="text-xs font-medium text-text-secondary uppercase tracking-wider">Shop Address</p>
                                        <p className="text-sm font-medium text-text-main dark:text-gray-200 truncate" title={customer.ShopAddress}>{customer.ShopAddress || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Internal Notes (Placeholder) */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-5">
                        <h3 className="text-sm font-bold text-text-main dark:text-white mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[18px]">sticky_note_2</span>
                            Internal Notes
                        </h3>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-lg p-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                No internal notes added yet.
                            </p>
                        </div>
                        <button className="mt-3 text-xs font-medium text-primary hover:text-green-600 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">add</span>
                            Add Note
                        </button>
                    </div>
                </div>

                {/* Right Column: Stats & Orders */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-text-secondary mb-1">Total Purchases</p>
                                <p className="text-2xl font-black text-text-main dark:text-white">{taka}{totalSpent.toFixed(2)}</p>
                            </div>
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary dark:bg-primary/20">
                                <span className="material-symbols-outlined">shopping_bag</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between relative overflow-hidden">
                            <div className={`absolute right-0 top-0 w-1 h-full ${totalDue > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            <div>
                                <p className="text-xs font-medium text-text-secondary mb-1">Total Due</p>
                                <p className={`text-2xl font-black ${totalDue > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {taka}{totalDue.toFixed(2)}
                                </p>
                            </div>
                            <div className={`size-10 rounded-full flex items-center justify-center ${totalDue > 0 ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-green-50 text-green-500 dark:bg-green-900/20'}`}>
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-text-secondary mb-1">Current Balance</p>
                                <p className="text-2xl font-black text-text-main dark:text-white">{taka}{customer.Balance?.toFixed(2) || '0.00'}</p>
                            </div>
                            <div className="size-10 rounded-full bg-green-50 flex items-center justify-center text-green-500 dark:bg-green-900/20">
                                <span className="material-symbols-outlined">account_balance_wallet</span>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-text-secondary mb-1">Last Order</p>
                                <p className="text-2xl font-black text-text-main dark:text-white">{lastOrderDate}</p>
                            </div>
                            <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 dark:bg-blue-900/20">
                                <span className="material-symbols-outlined">event</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders Table */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 dark:border-[var(--color-surface-dark-border)] flex-1">
                        <div className="p-6 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                Recent Orders
                                <span className="text-sm font-medium text-text-secondary ml-2 whitespace-nowrap">({orders.length} loaded)</span>
                            </h2>
                            <div className="flex items-center gap-3">
                                <select
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="">All Statuses</option>
                                    <option value="0">Pending</option>
                                    <option value="1">Partial</option>
                                    <option value="2">Paid</option>
                                </select>
                                <select
                                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary"
                                    value={yearFilter}
                                    onChange={(e) => setYearFilter(e.target.value)}
                                >
                                    <option value="">All Years</option>
                                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                    <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                                    <option value={new Date().getFullYear() - 2}>{new Date().getFullYear() - 2}</option>
                                    <option value={new Date().getFullYear() - 3}>{new Date().getFullYear() - 3}</option>
                                </select>
                            </div>
                        </div>

                        {loadingFilters ? (
                            <div className="p-8 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary border-gray-200"></div>
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary">
                                No orders found for this customer.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                                    <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[var(--color-surface-dark-solid)] dark:text-gray-400">
                                        <tr>
                                            <th className="px-6 py-4 font-bold" scope="col">Order ID</th>
                                            <th className="px-6 py-4 font-bold" scope="col">Date</th>
                                            {/* <th className="px-6 py-4 font-bold" scope="col">Items</th> -- Skipped as Order model doesn't always populate items deeply here */}
                                            <th className="px-6 py-4 font-bold" scope="col">Status</th>
                                            <th className="px-6 py-4 font-bold text-right" scope="col">Discount</th>
                                            <th className="px-6 py-4 font-bold text-right" scope="col">Amount</th>
                                            <th className="px-6 py-4 font-bold text-center" scope="col">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-[var(--color-surface-dark-card)]">
                                        {orders.map((order, index) => {
                                            const isLastElement = orders.length === index + 1;
                                            return (
                                                <tr
                                                    key={order.Id}
                                                    ref={isLastElement ? lastOrderElementRef : null}
                                                    className="border-b dark:border-[var(--color-surface-dark-border)] hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                                >
                                                    <td className="px-6 py-4 font-medium text-primary">#ORD-{order.Id}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-text-secondary">{formatFullDate(order.CreatedAt)}</td>
                                                    <td className="px-6 py-4">
                                                        {getPaymentStatusBadge(order.PaymentStatus)}
                                                    </td>
                                                    <td className="px-6 py-4 font-medium text-right text-red-500">
                                                        {(order.Discount || 0) > 0 ? `-${order.Discount.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-right">{taka}{order.NetAmount.toFixed(2)}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button
                                                            onClick={() => navigate(`/orders/${order.Id}`)}
                                                            className="text-gray-400 hover:text-primary transition-colors"
                                                            title="View Order"
                                                        >
                                                            <span className="material-symbols-outlined">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {loadingMore && (
                            <div className="p-4 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)] flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-gray-200"></div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
