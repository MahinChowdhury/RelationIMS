import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { type Order, type OrderPayment, PaymentStatus, type Product, OrderInternalStatus, type Inventory } from '../../types';
import InternalOrderCycle from './InternalOrderCycle';
import EditPaymentModal from './EditPaymentModal';
import { useLanguage } from '../../i18n/LanguageContext';
import { getAllInventories } from '../../services/InventoryService';

// ... (existing imports or keep them if they were already there, but careful not to duplicate)

const CopyableBarcode = ({ code, isReturned }: { code: string, isReturned?: boolean }) => {
    const { t } = useLanguage();
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isReturned) {
        return (
            <button
                onClick={handleCopy}
                className="font-mono text-xs text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 px-2.5 py-1 rounded-md bg-red-50 dark:bg-red-900/20 shadow-sm flex items-center gap-1.5 hover:bg-red-100 dark:hover:bg-red-800/40 hover:border-red-300 dark:hover:border-red-700 transition-all active:scale-95 group/code"
                title={`${t.common.returnedItem || 'Returned Item'} (${t.common.clickToCopy || 'Click to copy'})`}
            >
                {code}
                <span className={`material-symbols-outlined text-[14px] transition-all duration-300 ${copied ? 'text-blue-500 scale-110' : 'text-red-500 opacity-60 group-hover/code:opacity-100'}`}>
                    {copied ? 'done_all' : 'assignment_return'}
                </span>
            </button>
        );
    }

    return (
        <button
            onClick={handleCopy}
            className="font-mono text-xs text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/20 shadow-sm flex items-center gap-1.5 hover:bg-green-100 dark:hover:bg-green-800/40 hover:border-green-300 dark:hover:border-green-700 transition-all active:scale-95 group/code"
            title={`${t.common.soldItem || 'Sold Item'} (${t.common.clickToCopy || 'Click to copy'})`}
        >
            {code}
            <span className={`material-symbols-outlined text-[14px] transition-all duration-300 ${copied ? 'text-blue-500 scale-110' : 'text-green-500 opacity-60 group-hover/code:opacity-100'}`}>
                {copied ? 'done_all' : 'check_circle'}
            </span>
        </button>
    );
};

const MiniOrderCycle = ({ status, t }: { status: OrderInternalStatus; t: any }) => {
    const isArranging = status >= OrderInternalStatus.Arranging;
    const isArranged = status >= OrderInternalStatus.Arranged;
    const isConfirmed = status === OrderInternalStatus.Confirmed;

    return (
        <div className="flex items-center gap-1 bg-white dark:bg-[var(--color-surface-dark-card)] px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm" title={t.orders.internalOrderCycle || 'Internal Order Cycle'}>
            <div className="size-5 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-[12px]">add_shopping_cart</span>
            </div>
            <div className={`w-4 md:w-6 h-0.5 transition-colors ${isArranging ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

            <div className={`size-5 rounded-full flex items-center justify-center border-2 transition-colors ${isArranged || isConfirmed ? 'bg-green-500 border-green-500 text-white shadow-sm' : isArranging ? 'border-primary bg-green-50 dark:bg-green-900/20 text-primary' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                {isArranged || isConfirmed ? <span className="material-symbols-outlined text-[12px]">check</span> : <span className="material-symbols-outlined text-[12px]">fact_check</span>}
            </div>

            <div className={`w-4 md:w-6 h-0.5 transition-colors ${isConfirmed ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`}></div>

            <div className={`size-5 rounded-full flex items-center justify-center border-2 transition-colors ${isConfirmed ? 'bg-green-500 border-green-500 text-white shadow-sm' : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400'}`}>
                <span className="material-symbols-outlined text-[12px]">check_circle</span>
            </div>
        </div>
    );
};

export default function OrderDetailsPage() {
    const { t } = useLanguage();
    const taka = '\u09F3';
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const viewMode = searchParams.get('view');
    const [order, setOrder] = useState<Order | null>(null);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const [showPaymentEditModal, setShowPaymentEditModal] = useState(false);

    const handleEditOrder = () => {
        if (!order) return;
        if (order.InternalStatus === OrderInternalStatus.Confirmed) {
            setShowPaymentEditModal(true);
        } else {
            navigate(`/orders/edit/${order.Id}`);
        }
    };

    const [arrangedItems, setArrangedItems] = useState<any[]>([]);
    const [expandedVariants, setExpandedVariants] = useState<Set<number>>(new Set());

    const toggleVariantExpand = (itemId: number) => {
        const newSet = new Set(expandedVariants);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        setExpandedVariants(newSet);
    };

    useEffect(() => {
        if (id) {
            loadOrderDetails(Number(id));
            loadArrangedItems(Number(id));
        }
        getAllInventories().then(setInventories).catch(console.error);
    }, [id]);

    useEffect(() => {
        if (order && !loading && searchParams.get('autoPrint') === 'true') {
            setTimeout(() => {
                window.print();
            }, 1000); // Slight delay to ensure render
        }
    }, [order, loading, searchParams]);

    const loadArrangedItems = async (orderId: number) => {
        try {
            const res = await api.get(`/Arrangement/items/${orderId}`);
            setArrangedItems(res.data);
        } catch (err) {
            console.error("Failed to load arranged items", err);
        }
    }

    const loadOrderDetails = async (orderId: number) => {
        if (isNaN(orderId)) {
            setError(t.orders.orderNotFound || 'Invalid order ID.');
            setLoading(false);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await api.get<Order>(`/Order/${orderId}`);
            let orderData = res.data;

            // Fetch product details for items
            if (orderData.OrderItems && orderData.OrderItems.length > 0) {
                const itemsWithProducts = await Promise.all(orderData.OrderItems.map(async (item) => {
                    try {
                        const prodRes = await api.get<Product>(`/Product/${item.ProductId}`);
                        return { ...item, Product: prodRes.data };
                    } catch (err) {
                        console.error(`Failed to load product ${item.ProductId}:`, err);
                        return item;
                    }
                }));
                orderData = { ...orderData, OrderItems: itemsWithProducts };
            }

            setOrder(orderData);
        } catch (err: any) {
            console.error('Failed to load order:', err);
            if (err.response?.status === 404) {
                setError(t.orders.orderNotFound || 'Order not found.');
            } else {
                setError(t.orders.failedToLoad || 'Failed to load order details. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                <p className="mt-4 text-text-secondary font-medium">{t.common.loading || 'Loading order details...'}</p>
            </div>
        );
    }

    if (error || !order) return <div className="p-4 text-center">{error || t.orders.orderNotFound || 'Order not found'}</div>;

    // GATEWAY LOGIC
    const isConfirmed = order.InternalStatus === OrderInternalStatus.Confirmed;

    // Show cycle if explicitly requested OR (status is not Confirmed AND view is not forced to details)
    if (viewMode === 'cycle' || (!isConfirmed && viewMode !== 'details')) {
        return <InternalOrderCycle order={order} />;
    }

    // ... (rest of the existing Order details render)





    const formatDate = (dateString: string) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return t.common.notAvailable || 'N/A';
        return new Date(dateString).toLocaleDateString(t.common.dateLocale || 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getPaymentStatusText = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.Pending: return t.common.pending || 'Pending';
            case PaymentStatus.Partial: return t.orders.partial || 'Partial';
            case PaymentStatus.Paid: return t.common.paid || 'Paid';
            default: return t.common.unknown || 'Unknown';
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-background-light dark:bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div>
                <p className="mt-4 text-text-secondary font-medium">Loading order details...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="p-4 min-h-screen bg-background-light dark:bg-background-dark flex justify-center items-center">
                <div className="max-w-md w-full text-center">
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-8 mb-6">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">{t.common.somethingWentWrong || 'Oops! Something went wrong'}</h2>
                        <p className="text-red-600 dark:text-red-400">{error || t.orders.orderNotFound || 'Order not found'}</p>
                    </div>
                    <Link to="/orders" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                        <span className="material-symbols-outlined">arrow_back</span>
                        {t.common.backToOrders || 'Back to Orders'}
                    </Link>
                </div>
            </div>
        );
    }

    const paidAmount = order.PaidAmount ?? (order.PaymentStatus === PaymentStatus.Paid ? order.NetAmount : (order.PaymentStatus === PaymentStatus.Partial ? order.NetAmount / 2 : 0));
    const dueAmount = order.NetAmount - paidAmount;
    const paidPercentage = order.NetAmount > 0 ? (paidAmount / order.NetAmount) * 100 : 0;

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 font-display text-text-main dark:text-white bg-background-light dark:bg-background-dark min-h-screen">
            

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight">{t.common.order || 'Order'} #{order.Id}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border
                            ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' :
                                order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                            {getPaymentStatusText(order.PaymentStatus)}
                        </span>

                        {order.InternalStatus !== OrderInternalStatus.Confirmed && (
                            <Link to={`/arrangement/${order.Id}`} className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                                <span className="material-symbols-outlined text-xs">conveyor_belt</span>
                                {order.InternalStatus === OrderInternalStatus.Created ? (t.orders.pendingArrangement || 'Pending Arrangement') :
                                    order.InternalStatus === OrderInternalStatus.Arranging ? (t.orders.arranging || 'Arranging') :
                                        order.InternalStatus === OrderInternalStatus.Arranged ? (t.orders.arrangedConfirmNow || 'Arranged (Confirm Now)') : (t.common.unknown || 'Unknown')}
                            </Link>
                        )}
                    </div>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">{t.orders.placedOn || 'Placed on'} {formatDate(order.CreatedAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                    <MiniOrderCycle status={order.InternalStatus} t={t} />
                    <div className="flex flex-wrap justify-end gap-3">
                        <Link to={`/orders/${order.Id}/invoice`} className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#e7f3eb] dark:border-gray-700 bg-white dark:bg-[var(--color-surface-dark-card)] text-text-main dark:text-white hover:bg-[#f8fcf9] dark:hover:bg-white/5 font-bold text-sm transition-colors shadow-sm">
                            <span className="material-symbols-outlined text-lg">print</span>
                            {t.orders.printInvoice || 'Print Invoice'}
                        </Link>
                        <button onClick={handleEditOrder} className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white hover:bg-primary-dark font-bold text-sm transition-colors shadow-sm shadow-primary/20">
                            <span className="material-symbols-outlined text-lg">edit</span>
                            {order.InternalStatus === OrderInternalStatus.Confirmed ? (t.orders.editOrderPayment || 'Edit Payment') : (t.orders.editOrder || 'Edit Order')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info */}
                <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 border-b border-[#f0f7f2] dark:border-[var(--color-surface-dark-border)] pb-3">
                        <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            {t.orders.customerDetails || 'Customer Details'}
                        </h3>
                        <Link to={`/customers/${order.CustomerId}`} className="text-primary hover:text-green-700 text-sm font-semibold">{t.orders.viewProfile || 'View Profile'}</Link>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex flex-col items-center sm:items-start gap-3 min-w-[120px]">
                            <div className="size-20 rounded-full bg-cover bg-center border-2 border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] bg-gray-100 flex items-center justify-center text-3xl font-bold text-text-secondary">
                                {order.Customer?.Name?.charAt(0) || '#'}
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-text-main dark:text-white text-lg">{order.Customer?.Name || t.orders.unknownCustomer || 'Unknown Customer'}</p>
                                <p className="text-xs text-text-secondary">ID: #{order.CustomerId}</p>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{t.orders.contactInfo || 'Contact Info'}</p>

                                    <div className="flex items-center gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base">call</span>
                                        <a className="hover:underline" href={`tel:${order.Customer?.Phone || ''}`}>{order.Customer?.Phone || t.common.notAvailable || 'N/A'}</a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Order Location / Shop</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">storefront</span>
                                        <span className="whitespace-pre-wrap">
                                            {order.ShopNo !== undefined ? (inventories.find(i => i.Id === order.ShopNo)?.Name || `Shop #${order.ShopNo}`) : 'Main Shop'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{t.orders.customerAddress || 'Customer Address'}</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.Address || t.orders.noShippingAddress || 'No shipping address provided.'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{t.orders.shopName || 'Shop Name'}</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.ShopName || t.orders.noShopName || 'No shop name provided.'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">{t.orders.shopAddress || 'Shop Address'}</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.ShopAddress || t.orders.noShopAddress || 'No shop address provided.'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 border-b border-[#f0f7f2] dark:border-[var(--color-surface-dark-border)] pb-3">
                        <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            {t.orders.paymentDetails || 'Payment Details'}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border
                            ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' :
                                order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                            {getPaymentStatusText(order.PaymentStatus)}
                        </span>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                            <div className="bg-[#f8fcf9] dark:bg-white/5 p-3 rounded-lg border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)]">
                                <p className="text-xs text-text-secondary mb-1">{t.orders.paymentMethods || 'Payment Method(s)'}</p>
                                {order.Payments && order.Payments.length > 0 ? (
                                    <div className="space-y-1">
                                        {order.Payments.map((p: OrderPayment, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-base ${p.PaymentMethod === 0 ? 'text-green-500' : p.PaymentMethod === 1 ? 'text-blue-500' : 'text-pink-500'}`}>
                                                        {p.PaymentMethod === 0 ? 'payments' : p.PaymentMethod === 1 ? 'account_balance' : 'smartphone'}
                                                    </span>
                                                    <span className="font-medium text-text-main dark:text-white">
                                                        {p.PaymentMethod === 0 ? (t.orders.cash || 'Cash') : p.PaymentMethod === 1 ? (t.orders.bank || 'Bank') : (t.orders.bkash || 'Bkash')}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-text-main dark:text-white">{taka}{p.Amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-text-main dark:text-white">credit_card</span>
                                        <span className="font-bold text-sm text-text-main dark:text-white">{t.common.default || 'Standard'}</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#f8fcf9] dark:bg-white/5 p-3 rounded-lg border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)]">
                                <p className="text-xs text-text-secondary mb-1">{t.orders.orderType || 'Order Type'}</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-main dark:text-white">shopping_bag</span>
                                    <span className="font-bold text-sm text-text-main dark:text-white">{t.orders.retail || 'Retail'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">{t.orders.paidByCustomer || 'Total Amount Paid'}</p>
                                    <p className="text-xl font-bold text-primary">{taka}{paidAmount.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-text-secondary">{t.orders.remainingDue || 'Remaining Due'}</p>
                                    <p className={`text-xl font-bold ${dueAmount > 0 ? 'text-red-500' : 'text-text-main dark:text-white'}`}>{taka}{dueAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-2.5 rounded-full ${paidPercentage === 100 ? 'bg-primary' : 'bg-primary/80'}`} style={{ width: `${paidPercentage}%` }}></div>
                            </div>
                            <p className="text-xs text-center text-text-secondary">{(t.orders.paymentCompleted || '{percentage}% of payment completed').replace('{percentage}', paidPercentage.toFixed(0))}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items & Summary Section */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Order Items Table */}
                <div className="flex-1 bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#f0f7f2] dark:border-[var(--color-surface-dark-border)] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">{t.orders.orderItems || 'Order Items'}</h3>
                        <span className="text-sm text-text-secondary">{order.OrderItems?.length || 0} {t.common.items || 'Items'}</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#f8fcf9] dark:bg-white/5 text-text-secondary font-medium">
                                <tr>
                                    <th className="px-6 py-3 w-12">#</th>
                                    <th className="px-6 py-3">{t.orders.productDetails || 'Product Details'}</th>
                                    <th className="px-6 py-3 text-right">{t.orders.unitPrice || 'Unit Price'}</th>
                                    <th className="px-6 py-3 text-center">{t.common.quantity || 'Quantity'}</th>
                                    <th className="px-6 py-3 text-right">{t.common.total || 'Total'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f7f2] dark:divide-[#2a4032]">
                                {(!order.OrderItems || order.OrderItems.length === 0) ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-text-secondary">{t.orders.noItemsFoundInOrder || 'No items found in this order.'}</td>
                                    </tr>
                                ) : (
                                    // Grouping Logic: Group by ProductId + ColorId
                                    Object.values(order.OrderItems.reduce((groups, item) => {
                                        const key = `${item.ProductId}-${item.ProductVariant?.ProductColorId || 'NoColor'}`;
                                        if (!groups[key]) groups[key] = { items: [], product: item.Product, color: item.ProductVariant?.Color };
                                        groups[key].items.push(item);
                                        return groups;
                                    }, {} as Record<string, { items: typeof order.OrderItems, product: Product | undefined, color: any }>)).map((group, groupIdx) => (
                                        <>
                                            {/* Group Header */}
                                            <tr key={`group-${groupIdx}`} className="bg-gray-50/50 dark:bg-gray-800/30 border-b border-gray-100 dark:border-gray-700">
                                                <td colSpan={5} className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 rounded-lg bg-white dark:bg-gray-700 bg-cover bg-center shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                                            {group.product?.ImageUrls?.[0] ? (
                                                                <img src={group.product.ImageUrls[0]} alt={group.product.Name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="material-symbols-outlined text-gray-400">image</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm text-text-main dark:text-white flex items-center gap-2">
                                                                {group.product?.Name || t.common.unknownProduct || 'Unknown Product'}
                                                                {group.color && (
                                                                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-gray-600 text-xs border border-gray-200 dark:border-gray-500 font-normal flex items-center gap-1">
                                                                        <span className="size-2 rounded-full border border-gray-300" style={{ backgroundColor: group.color.HexCode }}></span>
                                                                        {group.color.Name}
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {group.product?.Category && <p className="text-xs text-text-secondary">{group.product.Category.Name}</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>

                                            {/* Variant Items */}
                                            {group.items.map((item) => {
                                                const variantArrangedItems = arrangedItems.filter((ai: any) =>
                                                    ai.Variant?.Id === item.ProductVariantId && (ai.IsSold || ai.IsReturned || ai.isReturned)
                                                );
                                                const hasCodes = variantArrangedItems.length > 0;
                                                const isExpanded = expandedVariants.has(item.Id);

                                                return (
                                                    <React.Fragment key={item.Id}>
                                                        <tr
                                                            className={`hover:bg-green-50/30 dark:hover:bg-white/5 transition-colors group ${hasCodes ? 'cursor-pointer' : ''}`}
                                                            onClick={() => hasCodes && toggleVariantExpand(item.Id)}
                                                        >
                                                            <td className="px-6 py-3 pl-12 text-gray-400 font-mono text-xs border-l-4 border-transparent hover:border-green-400/30">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="material-symbols-outlined text-sm text-gray-300 rotate-90">subdirectory_arrow_right</span>
                                                                    {hasCodes && (
                                                                        <span className={`material-symbols-outlined text-sm text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                                            expand_more
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex flex-col gap-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="font-bold text-sm text-text-main dark:text-gray-300">
                                                                            {item.ProductVariant?.Size?.Name || item.ProductVariant?.Size?.Name || t.common.default || 'One Size'}
                                                                        </span>
                                                                        {hasCodes && !isExpanded && (
                                                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 rounded-full">
                                                                                <span className="material-symbols-outlined text-[10px]">qr_code_2</span>
                                                                                {variantArrangedItems.length}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-text-main dark:text-gray-200">
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-medium">{taka}{item.UnitPrice.toFixed(2)}</span>
                                                                    {(item.Discount || 0) > 0 && <span className="text-xs text-red-500">{t.orders.discount || 'Disc'}: -{taka}{item.Discount?.toFixed(2)}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-center text-text-main dark:text-gray-200 font-bold">{item.Quantity}</td>
                                                            <td className="px-6 py-3 text-right font-bold text-text-main dark:text-white">{taka}{item.Subtotal.toFixed(2)}</td>
                                                        </tr>
                                                        {/* Expanded Barcodes Row */}
                                                        {isExpanded && hasCodes && (
                                                            <tr className="bg-gray-50/30 dark:bg-black/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                                                <td colSpan={5} className="px-6 py-2 pl-16">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="material-symbols-outlined text-green-600 text-lg mt-0.5">qr_code_scanner</span>
                                                                        <div className="flex flex-wrap gap-2">
                                                                            {variantArrangedItems.map((ai: any, idx: number) => (
                                                                                <CopyableBarcode key={idx} code={ai.Code} isReturned={ai.IsReturned} />
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] p-6">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-6 border-b border-[#f0f7f2] dark:border-[var(--color-surface-dark-border)] pb-3">{t.orders.orderSummary || 'Order Summary'}</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">{t.common.subtotal || 'Subtotal'}</span>
                                <span className="text-text-main dark:text-white font-bold">{taka}{order.TotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">{t.orders.discount || 'Discount'}</span>
                                <span className="text-green-600 dark:text-green-400 font-bold">-{taka}{order.Discount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">{t.common.tax || 'Tax'} (0%)</span>
                                <span className="text-text-main dark:text-white font-bold">{taka}0.00</span>
                            </div>
                        </div>
                        <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-base font-bold text-text-main dark:text-white">{t.orders.netAmount || 'Net Amount'}</span>
                                <span className="text-xl font-black text-text-main dark:text-white">{taka}{order.NetAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-green-800 dark:text-green-300 font-medium">{t.orders.paidByCustomer || 'Paid by Customer'}</span>
                                <span className="text-green-800 dark:text-green-300 font-bold">{taka}{paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base pt-2 border-t border-green-200 dark:border-green-800/30">
                                <span className="text-red-600 dark:text-red-400 font-bold">{t.orders.totalDue || 'Total Due'}</span>
                                <span className="text-red-600 dark:text-red-400 font-black text-lg">{taka}{dueAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Next Payment Date Display */}
                        {order.NextPaymentDate && dueAmount > 0 && (
                            <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800/20 flex flex-col items-center justify-center mt-3 animate-in fade-in">
                                <span className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider mb-1">{t.orders.nextPaymentDate || 'Next Payment Date'}</span>
                                <span className="text-lg font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-base">calendar_clock</span>
                                    {formatDate(order.NextPaymentDate.toString())}
                                </span>
                            </div>
                        )}

                        <button className="w-full mt-6 bg-primary text-white font-bold h-12 rounded-lg hover:bg-primary-dark transition-all shadow-md flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">mark_email_read</span>
                            {t.orders.sendInvoiceEmail || 'Send Invoice Email'}
                        </button>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] p-6">
                        <h3 className="text-sm font-bold text-text-main dark:text-white mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-lg">sticky_note_2</span>
                            {t.orders.internalRemarks || 'Internal Remarks'}
                        </h3>
                        <textarea
                            readOnly
                            className="w-full bg-[#f8fcf9] dark:bg-black/20 border-none rounded-lg text-sm p-3 min-h-[100px] text-text-main dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-primary resize-none"
                            placeholder={t.orders.noRemarks || "No remarks for this order."}
                            value={order.Remarks || ''}
                        ></textarea>
                    </div>
                </div>
            </div>
            {/* Modal */}
            <EditPaymentModal
                isOpen={showPaymentEditModal}
                onClose={() => setShowPaymentEditModal(false)}
                order={order}
                onPaymentUpdated={() => {
                    loadOrderDetails(order.Id);
                }}
            />
        </div>
    );
}
