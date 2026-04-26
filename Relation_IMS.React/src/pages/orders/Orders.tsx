import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import { type Order, PaymentStatus, type Inventory } from '../../types';
import { getAllInventories } from '../../services/InventoryService';
import { useAuth } from '../../context/AuthContext';
import { DeleteOrderModal } from '../../components/orders/OrderModals';

export default function OrdersPage() {
    const { t } = useLanguage();
    const taka = '\u09F3';
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const isOwner = currentUser?.Roles?.includes('Owner');

    // State
    const [orders, setOrders] = useState<Order[]>([]);
    const [filtered, setFiltered] = useState<Order[]>([]);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);
    const [sortBy, setSortBy] = useState<'date' | 'amount' | ''>('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState<number | null>(null);

    // Infinite Scroll
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    // Initial Load & Infinite Scroll
    useEffect(() => {
        const controller = new AbortController();
        loadOrders(page === 1, controller.signal);
        if (page === 1) {
            getAllInventories({ signal: controller.signal }).then(setInventories).catch(err => {
                if (axios.isCancel(err)) return;
                console.error(err);
            });
        }
        return () => controller.abort();
    }, [page]);

    // Apply filters locally when data or filters change
    useEffect(() => {
        applyFilters();
    }, [orders, debouncedSearch, sortBy, filterStatus]);

    // Trigger reload on filters
    useEffect(() => {
        // Reset and load
        const controller = new AbortController();
        loadOrders(true, controller.signal);
        return () => controller.abort();
    }, [debouncedSearch, filterStatus, sortBy, startDate, endDate]);

    // Infinite Scroll trigger
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    const loadOrders = async (reset: boolean, signal?: AbortSignal) => {
        setLoading(true);
        try {
            const p = reset ? 1 : page;
            if (reset) setPage(1);

            let url = `/Order?pageNumber=${p}&pageSize=${pageSize}`;
            if (startDate) url += `&startDate=${startDate}`;
            if (endDate) url += `&endDate=${endDate}`;

            const res = await api.get<{ data: Order[] } | Order[]>(url, { signal });
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
            if (axios.isCancel(error)) return;
            console.error('Failed to load orders', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteOrder = async () => {
        if (!orderToDelete) return;
        
        try {
            await api.delete(`/Order/${orderToDelete}`);
            setOrders(prev => prev.filter(o => o.Id !== orderToDelete));
            setShowDeleteModal(false);
            setOrderToDelete(null);
        } catch (error) {
            console.error('Failed to delete order', error);
            alert("Failed to delete the order. Please try again.");
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
                order.Customer?.Phone?.includes(term)
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
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 font-display text-text-main">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-text-main dark:text-white tracking-tight">{t.orders.ordersList}</h1>
                    <p className="text-text-secondary dark:text-gray-400 text-base max-w-2xl">
                        {t.orders.subtitle}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/orders/create')}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all">
                        <span className="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                        {t.orders.createOrder}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-[var(--color-surface-dark-card)] p-4 rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] shadow-sm">
                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <span className="material-symbols-outlined text-text-secondary">search</span>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full p-2.5 ps-10 text-sm text-text-main border border-gray-200 rounded-lg bg-gray-50 focus:ring-primary focus:border-primary dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-all"
                        placeholder="Search by order ID, customer name..."
                    />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:text-white"
                            placeholder="Start Date"
                        />
                        <span className="text-text-secondary text-sm">to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:text-white"
                            placeholder="End Date"
                        />
                    </div>
                    <div className="relative">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:text-white"
                        >
                            <option value="all">Payment: All</option>
                            <option value="paid">Paid</option>
                            <option value="pending">Pending</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        </div>
                    </div>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="appearance-none bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 pr-8 dark:bg-[var(--color-surface-dark-solid)] dark:border-gray-700 dark:text-white"
                        >
                            <option value="">Sort by: Default</option>
                            <option value="date">Sort by: Date</option>
                            <option value="amount">Sort by: Amount</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-text-secondary">
                            <span className="material-symbols-outlined text-[18px]">expand_more</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* List Header (Desktop) */}
            <div className="hidden lg:flex px-2 text-xs font-bold text-text-secondary uppercase tracking-wider gap-2">
                <div className="w-[60px]">ID</div>
                <div className="flex-1 min-w-[120px]">Customer</div>
                <div className="w-[100px]">Shop</div>
                <div className="w-[70px]">Date</div>
                <div className="w-[65px] text-right">Disc.</div>
                <div className="w-[75px] text-right">Net</div>
                <div className="w-[70px] text-right">Paid</div>
                <div className="w-[70px] text-right">Due</div>
                <div className="w-[60px] text-right">Status</div>
                <div className="w-[80px] text-right">Actions</div>
            </div>

            {/* List Items */}
            <div className="flex flex-col gap-3">
                {filtered.map((order) => (
                    <div key={order.Id} className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-3 md:p-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-3 group hover:shadow-md transition-all hover:border-primary/30">
                        {/* Order ID */}
                        <div className="flex items-center justify-between lg:w-[60px]">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Order ID</span>
                            <Link to={`/orders/${order.Id}`} className="font-bold text-primary hover:underline text-sm truncate">
                                #{order.Id}
                            </Link>
                        </div>

                        {/* Customer */}
                        <div className="flex items-center gap-2 lg:flex-1 min-w-[120px]">
                            <div className="size-7 rounded-full bg-gray-200 bg-center bg-cover border border-gray-100 dark:border-gray-700 shrink-0 flex items-center justify-center text-xs font-bold text-gray-500">
                                {order.Customer?.Name?.charAt(0) || '#'}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <Link to={`/customers/${order.CustomerId}`} className="font-bold text-text-main dark:text-white text-sm leading-tight truncate max-w-[100px] hover:text-primary">
                                        {order.Customer?.Name || `Customer #${order.CustomerId}`}
                                    </Link>
                                </div>
                                <p className="text-[10px] text-text-secondary font-medium mt-0.5 truncate">{order.Customer?.ShopName || 'No email'}</p>
                            </div>
                        </div>

                        {/* Shop Info */}
                        <div className="flex items-center justify-between lg:block lg:w-[100px]">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Shop</span>
                            <span className="text-sm font-medium text-text-main dark:text-gray-300">
                                {order.ShopNo !== undefined ? (inventories.find(i => i.Id === order.ShopNo)?.Name || `Shop #${order.ShopNo}`) : 'Main Shop'}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="flex items-center justify-between lg:block lg:w-[70px]">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Date</span>
                            <span className="text-sm text-text-main dark:text-white">{formatDate(order.CreatedAt)}</span>
                        </div>

                        {/* Discount */}
                        <div className="flex items-center justify-between lg:block lg:w-[65px] lg:text-right">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Discount</span>
                            <span className={`text-xs ${order.Discount > 0 ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                {order.Discount > 0 ? '-' : ''}{taka}{order.Discount.toFixed(0)}
                            </span>
                        </div>

                        {/* Net Amount */}
                        <div className="flex items-center justify-between lg:block lg:w-[75px] lg:text-right">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Net Amount</span>
                            <span className="text-xs font-bold text-text-main dark:text-white">{taka}{order.NetAmount.toFixed(0)}</span>
                        </div>

                        {/* Paid Amount */}
                        <div className="flex items-center justify-between lg:block lg:w-[70px] lg:text-right">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Paid Amt</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                {taka}{(order.PaidAmount ?? (order.PaymentStatus === PaymentStatus.Paid ? order.NetAmount : 0)).toFixed(0)}
                            </span>
                        </div>

                        {/* Due Amount */}
                        <div className="flex items-center justify-between lg:block lg:w-[70px] lg:text-right">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Due Amt</span>
                            <span className="text-xs font-medium text-red-500 dark:text-red-400">
                                {taka}{(order.NetAmount - (order.PaidAmount ?? (order.PaymentStatus === PaymentStatus.Paid ? order.NetAmount : 0))).toFixed(0)}
                            </span>
                            {/* Next Payment Date */}
                            {order.NextPaymentDate && (order.NetAmount - (order.PaidAmount ?? (order.PaymentStatus === PaymentStatus.Paid ? order.NetAmount : 0))) > 0 && (
                                <div className="text-[10px] text-text-secondary mt-0.5" title="Next Payment Date">
                                    {formatDate(order.NextPaymentDate.toString())}
                                </div>
                            )}
                        </div>

                        {/* Status */}
                        <div className="flex items-center justify-between lg:block lg:w-[60px] lg:text-right">
                            <span className="text-xs text-text-secondary uppercase font-bold lg:hidden">Status</span>
                            <div className="flex justify-end">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide font-bold border
                                    ${order.PaymentStatus === PaymentStatus.Paid
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800'
                                        : order.PaymentStatus === PaymentStatus.Partial
                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800'
                                    }`}>
                                    {getPaymentStatusText(order.PaymentStatus)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2 lg:mt-0 justify-end w-full lg:w-[80px] border-t lg:border-t-0 border-gray-100 dark:border-[var(--color-surface-dark-border)] pt-2 lg:pt-0">
                            <button
                                onClick={() => navigate(`/orders/${order.Id}`)}
                                className="flex items-center justify-center size-7 rounded-lg bg-white border border-gray-200 text-text-main hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-300 dark:hover:bg-white/5 transition-colors"
                                title="View Details">
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                            </button>
                            <button
                                onClick={() => navigate(`/orders/${order.Id}/invoice`)}
                                className="flex items-center justify-center size-7 rounded-lg bg-white border border-gray-200 text-text-main hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-300 dark:hover:bg-white/5 transition-colors" title="Print Invoice">
                                <span className="material-symbols-outlined text-[14px]">print</span>
                            </button>
                            {isOwner && (
                                <button
                                    onClick={() => { setOrderToDelete(order.Id); setShowDeleteModal(true); }}
                                    className="flex items-center justify-center size-7 rounded-lg bg-white border border-gray-200 text-text-main hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:bg-[var(--color-surface-dark-solid)] dark:border-[var(--color-surface-dark-border)] dark:text-gray-300 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors" title="Delete Order">
                                    <span className="material-symbols-outlined text-[14px]">delete</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Infinite Scroll Anchor */}
            <div ref={containerRef} className="flex flex-col items-center justify-center py-4 mt-4">
                {loading && (
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-text-secondary text-sm font-medium">Loading orders...</span>
                    </div>
                )}
                {!hasMore && filtered.length > 0 && (
                    <p className="text-text-secondary text-sm">No more orders to load.</p>
                )}
                {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center py-10 opacity-60">
                        <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
                        <p className="text-text-secondary">No orders found.</p>
                    </div>
                )}
            </div>

            {/* Delete Modal */}
            <DeleteOrderModal
                show={showDeleteModal}
                onCancel={() => { setShowDeleteModal(false); setOrderToDelete(null); }}
                onConfirm={handleDeleteOrder}
            />
        </div>
    );
}
