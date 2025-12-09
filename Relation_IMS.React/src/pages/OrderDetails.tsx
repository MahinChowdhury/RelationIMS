import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { type Order, PaymentStatus, type Product } from '../types';

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
                        // Create a new item object with the fetched Product
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
            <div className="flex flex-col items-center justify-center py-20 min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
                <p className="mt-4 text-gray-600 text-lg">Loading order details…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 min-h-screen bg-gray-50 flex justify-center">
                <div className="max-w-5xl w-full">
                    <Link to="/orders" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Orders</Link>
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 text-red-800 flex items-center gap-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="px-4 md:px-8 lg:px-40 flex flex-1 justify-center py-6 bg-gray-50 min-h-screen">
            <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1">

                {/* Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <Link to="/orders" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-base font-medium">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Back to Orders
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">Order #{order.Id}</h1>
                        </div>
                        <span className={`inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold border-2 
                            ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-50 text-green-700 border-green-200' :
                                order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    'bg-red-50 text-red-700 border-red-200'}`}>
                            {getPaymentStatusText(order.PaymentStatus)}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm mt-3 ml-0 md:ml-32">Placed on {formatDate(order.CreatedAt)}</p>
                </div>

                {/* Order Items */}
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h2 className="text-gray-900 text-lg font-bold">Order Items</h2>
                    </div>

                    {(!order.OrderItems || order.OrderItems.length === 0) ? (
                        <div className="p-12 text-center text-gray-400">
                            <svg className="mx-auto w-16 h-16 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2" />
                            </svg>
                            <p className="text-base">No items in this order.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {order.OrderItems.map((item, i) => (
                                <div key={item.Id} className={`p-4 md:p-6 hover:bg-gray-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Product Image */}
                                        <div className="flex-shrink-0">
                                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center">
                                                {item.Product?.ImageUrls && item.Product.ImageUrls.length > 0 ? (
                                                    <img
                                                        src={item.Product.ImageUrls[0]}
                                                        alt={item.Product.Name || 'Product'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-gray-400">
                                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col md:flex-row md:justify-between gap-3">
                                                <div className="flex-1">
                                                    <h3 className="text-gray-900 font-bold text-base md:text-lg mb-1">
                                                        {item.Product ? item.Product.Name : `Product #${item.ProductId}`}
                                                    </h3>
                                                    {item.Product?.Description && (
                                                        <p className="text-gray-600 text-sm line-clamp-2 mb-2">{item.Product.Description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 text-sm">
                                                        {item.Product?.Category && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                                                {item.Product.Category.Name}
                                                            </span>
                                                        )}
                                                        {item.Product?.Brand && (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                                                                {item.Product.Brand.Name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="md:text-right space-y-1 md:min-w-[140px]">
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Qty:</span> {item.Quantity}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Unit Price:</span> ৳{item.UnitPrice.toFixed(2)}
                                                    </div>
                                                    <div className="text-base md:text-lg font-bold text-gray-900 pt-1 border-t border-gray-200">
                                                        ৳{item.Subtotal.toFixed(2)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* Payment Summary */}
                <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h2 className="text-gray-900 text-lg font-bold mb-5 pb-3 border-b border-gray-200">Payment Summary</h2>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-base">
                            <span className="text-gray-600 font-medium">Total Amount</span>
                            <span className="text-gray-900 font-semibold">৳{order.TotalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-base">
                            <span className="text-gray-600 font-medium">Discount</span>
                            <span className="text-red-600 font-semibold">- ৳{order.Discount.toFixed(2)}</span>
                        </div>
                        <div className="border-t-2 border-gray-200 pt-4 flex justify-between items-center">
                            <span className="text-gray-900 font-bold text-lg">Net Amount</span>
                            <span className="text-gray-900 font-bold text-2xl">৳{order.NetAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className="text-gray-600 font-medium">Payment Status</span>
                            <span className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-bold
                                ${order.PaymentStatus === PaymentStatus.Paid ? 'bg-green-100 text-green-700' :
                                    order.PaymentStatus === PaymentStatus.Partial ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'}`}>
                                {getPaymentStatusText(order.PaymentStatus)}
                            </span>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}
