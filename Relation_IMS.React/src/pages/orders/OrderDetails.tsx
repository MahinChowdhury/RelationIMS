import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { type Order, type OrderPayment, PaymentStatus, type Product } from '../../types';

export default function OrderDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (id) {
            loadOrderDetails(Number(id));
        }
    }, [id]);

    const loadOrderDetails = async (orderId: number) => {
        if (isNaN(orderId)) {
            setError('Invalid order ID.');
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
                setError('Order not found.');
            } else {
                setError('Failed to load order details. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
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
                        <h2 className="text-xl font-bold text-red-800 dark:text-red-300 mb-2">Oops! Something went wrong</h2>
                        <p className="text-red-600 dark:text-red-400">{error || 'Order not found'}</p>
                    </div>
                    <Link to="/orders" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-green-600 transition-colors shadow-lg shadow-green-500/20">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Orders
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
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-sm">
                <Link className="text-text-secondary font-medium hover:text-primary transition-colors flex items-center" to="/">
                    <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                    Dashboard
                </Link>
                <span className="text-text-secondary material-symbols-outlined text-base">chevron_right</span>
                <Link className="text-text-secondary font-medium hover:text-primary transition-colors" to="/orders">Orders</Link>
                <span className="text-text-secondary material-symbols-outlined text-base">chevron_right</span>
                <span className="text-text-main dark:text-gray-200 font-bold">Order #{order.Id}</span>
            </div>

            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight">Order #{order.Id}</h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border
                            ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800' :
                                order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800' :
                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                            {getPaymentStatusText(order.PaymentStatus)}
                        </span>
                    </div>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base">Placed on {formatDate(order.CreatedAt)}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#e7f3eb] dark:border-gray-700 bg-white dark:bg-[#1a2e22] text-text-main dark:text-white hover:bg-[#f8fcf9] dark:hover:bg-white/5 font-bold text-sm transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">print</span>
                        Print Invoice
                    </button>
                    <button className="flex items-center gap-2 px-4 h-10 rounded-lg border border-[#e7f3eb] dark:border-gray-700 bg-white dark:bg-[#1a2e22] text-text-main dark:text-white hover:bg-[#f8fcf9] dark:hover:bg-white/5 font-bold text-sm transition-colors shadow-sm">
                        <span className="material-symbols-outlined text-lg">download</span>
                        Download PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-white hover:bg-green-600 font-bold text-sm transition-colors shadow-sm shadow-green-500/20">
                        <span className="material-symbols-outlined text-lg">edit</span>
                        Edit Order
                    </button>
                </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Customer Info */}
                <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 border-b border-[#f0f7f2] dark:border-[#2a4032] pb-3">
                        <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">person</span>
                            Customer Details
                        </h3>
                        <Link to={`/customers/${order.CustomerId}`} className="text-primary hover:text-green-700 text-sm font-semibold">View Profile</Link>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-6">
                        <div className="flex flex-col items-center sm:items-start gap-3 min-w-[120px]">
                            <div className="size-20 rounded-full bg-cover bg-center border-2 border-[#e7f3eb] dark:border-[#2a4032] bg-gray-100 flex items-center justify-center text-3xl font-bold text-text-secondary">
                                {order.Customer?.Name?.charAt(0) || '#'}
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="font-bold text-text-main dark:text-white text-lg">{order.Customer?.Name || 'Unknown Customer'}</p>
                                <p className="text-xs text-text-secondary">ID: #{order.CustomerId}</p>
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Contact Info</p>
                                    
                                    <div className="flex items-center gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base">call</span>
                                        <a className="hover:underline" href={`tel:${order.Customer?.Phone || ''}`}>{order.Customer?.Phone || 'N/A'}</a>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Customer Address</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.Address || 'No shipping address provided.'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Shop Name</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.ShopName || 'No shop name provided.'}</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1">Shop Address</p>
                                    <div className="flex items-start gap-2 text-sm text-text-main dark:text-gray-200">
                                        <span className="material-symbols-outlined text-primary text-base mt-0.5">location_on</span>
                                        <span className="whitespace-pre-wrap">{order.Customer?.ShopAddress || 'No shop address provided.'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payment Info */}
                <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4 border-b border-[#f0f7f2] dark:border-[#2a4032] pb-3">
                        <h3 className="text-lg font-bold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">payments</span>
                            Payment Details
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
                            <div className="bg-[#f8fcf9] dark:bg-white/5 p-3 rounded-lg border border-[#e7f3eb] dark:border-[#2a4032]">
                                <p className="text-xs text-text-secondary mb-1">Payment Method(s)</p>
                                {order.Payments && order.Payments.length > 0 ? (
                                    <div className="space-y-1">
                                        {order.Payments.map((p: OrderPayment, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-base ${p.PaymentMethod === 0 ? 'text-green-500' : p.PaymentMethod === 1 ? 'text-blue-500' : 'text-pink-500'}`}>
                                                        {p.PaymentMethod === 0 ? 'payments' : p.PaymentMethod === 1 ? 'account_balance' : 'smartphone'}
                                                    </span>
                                                    <span className="font-medium text-text-main dark:text-white">
                                                        {p.PaymentMethod === 0 ? 'Cash' : p.PaymentMethod === 1 ? 'Bank' : 'Bkash'}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-text-main dark:text-white">৳{p.Amount.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-text-main dark:text-white">credit_card</span>
                                        <span className="font-bold text-sm text-text-main dark:text-white">Standard</span>
                                    </div>
                                )}
                            </div>
                            <div className="bg-[#f8fcf9] dark:bg-white/5 p-3 rounded-lg border border-[#e7f3eb] dark:border-[#2a4032]">
                                <p className="text-xs text-text-secondary mb-1">Order Type</p>
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-text-main dark:text-white">shopping_bag</span>
                                    <span className="font-bold text-sm text-text-main dark:text-white">Retail</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-medium text-text-secondary">Total Amount Paid</p>
                                    <p className="text-xl font-bold text-primary">৳{paidAmount.toFixed(2)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-text-secondary">Remaining Due</p>
                                    <p className={`text-xl font-bold ${dueAmount > 0 ? 'text-red-500' : 'text-text-main dark:text-white'}`}>৳{dueAmount.toFixed(2)}</p>
                                </div>
                            </div>
                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                <div className={`h-2.5 rounded-full ${paidPercentage === 100 ? 'bg-primary' : 'bg-primary/80'}`} style={{ width: `${paidPercentage}%` }}></div>
                            </div>
                            <p className="text-xs text-center text-text-secondary">{paidPercentage.toFixed(0)}% of payment completed</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Order Items & Summary Section */}
            <div className="flex flex-col lg:flex-row gap-6">
                {/* Order Items Table */}
                <div className="flex-1 bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#f0f7f2] dark:border-[#2a4032] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-text-main dark:text-white">Order Items</h3>
                        <span className="text-sm text-text-secondary">{order.OrderItems?.length || 0} Items</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-[#f8fcf9] dark:bg-white/5 text-text-secondary font-medium">
                                <tr>
                                    <th className="px-6 py-3">Product</th>
                                    <th className="px-6 py-3">List Price</th>
                                    <th className="px-6 py-3">Sold Price</th>
                                    <th className="px-6 py-3">Discount</th>
                                    <th className="px-6 py-3 text-center">Quantity</th>
                                    <th className="px-6 py-3 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f7f2] dark:divide-[#2a4032]">
                                {(!order.OrderItems || order.OrderItems.length === 0) ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-text-secondary">No items found in this order.</td>
                                    </tr>
                                ) : (
                                    order.OrderItems.map((item) => (
                                        <tr key={item.Id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="size-12 rounded-lg bg-gray-100 dark:bg-gray-700 bg-cover bg-center shrink-0 border border-[#e7f3eb] dark:border-gray-600 flex items-center justify-center overflow-hidden">
                                                        {item.Product?.ImageUrls?.[0] ? (
                                                            <img src={item.Product.ImageUrls[0]} alt={item.Product.Name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="material-symbols-outlined text-gray-400">image</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main dark:text-white truncate max-w-[200px]">{item.Product?.Name || `Item #${item.ProductId}`}</p>
                                                        {item.Product?.Category && <p className="text-xs text-text-secondary">{item.Product.Category.Name}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-secondary">
                                                <div className="flex flex-col">
                                                    <span className="line-through text-xs">৳{(item.UnitPrice + (item.Discount || 0)).toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-text-main dark:text-gray-200 font-bold">৳{item.UnitPrice.toFixed(2)}</td>
                                            <td className="px-6 py-4 text-red-500 font-medium">
                                                {(item.Discount || 0) > 0 ? `-৳${item.Discount?.toFixed(2)}` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-center text-text-main dark:text-gray-200">{item.Quantity}</td>
                                            <td className="px-6 py-4 text-right font-bold text-text-main dark:text-white">৳{item.Subtotal.toFixed(2)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="w-full lg:w-96 shrink-0 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] p-6">
                        <h3 className="text-lg font-bold text-text-main dark:text-white mb-6 border-b border-[#f0f7f2] dark:border-[#2a4032] pb-3">Order Summary</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">Subtotal</span>
                                <span className="text-text-main dark:text-white font-bold">৳{order.TotalAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">Discount</span>
                                <span className="text-green-600 dark:text-green-400 font-bold">-৳{order.Discount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-text-secondary font-medium">Tax (0%)</span>
                                <span className="text-text-main dark:text-white font-bold">৳0.00</span>
                            </div>
                        </div>
                        <div className="border-t border-dashed border-gray-300 dark:border-gray-600 pt-4 mb-4">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-base font-bold text-text-main dark:text-white">Net Amount</span>
                                <span className="text-xl font-black text-text-main dark:text-white">৳{order.NetAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/20 space-y-2">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-green-800 dark:text-green-300 font-medium">Paid by Customer</span>
                                <span className="text-green-800 dark:text-green-300 font-bold">৳{paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base pt-2 border-t border-green-200 dark:border-green-800/30">
                                <span className="text-red-600 dark:text-red-400 font-bold">Total Due</span>
                                <span className="text-red-600 dark:text-red-400 font-black text-lg">৳{dueAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <button className="w-full mt-6 bg-primary text-white font-bold h-12 rounded-lg hover:bg-green-600 transition-all shadow-md flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">mark_email_read</span>
                            Send Invoice Email
                        </button>
                    </div>

                    {/* Notes Card */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-[#2a4032] p-6">
                        <h3 className="text-sm font-bold text-text-main dark:text-white mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-gray-400 text-lg">sticky_note_2</span>
                            Internal Remarks
                        </h3>
                        <textarea
                            readOnly
                            className="w-full bg-[#f8fcf9] dark:bg-black/20 border-none rounded-lg text-sm p-3 min-h-[100px] text-text-main dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-primary resize-none"
                            placeholder="No remarks for this order."
                            value={order.Remarks || ''}
                        ></textarea>
                    </div>
                </div>
            </div>
        </div>
    );
}
