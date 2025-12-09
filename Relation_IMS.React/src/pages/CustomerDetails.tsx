import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import type { Customer, Order } from '../types';

export default function CustomerDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const customerId = Number(id);

    const [customer, setCustomer] = useState<Customer | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!customerId || isNaN(customerId)) {
            setError('Invalid customer ID');
            setLoading(false);
            return;
        }
        loadCustomerData();
    }, [customerId]);

    const loadCustomerData = async () => {
        try {
            setLoading(true);
            setError('');

            const custRes = await api.get(`/Customer/${customerId}`);
            setCustomer(custRes.data);

            const ordRes = await api.get(`/Order/customer/${customerId}`);
            setOrders(ordRes.data || []);
        } catch (err: any) {
            console.error('Failed to load data:', err);
            setError(err.response?.data?.message || 'Failed to load customer data.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString || dateString.startsWith('0001-01-01')) return 'N/A';
        return new Date(dateString).toLocaleDateString();
    };

    const getPaymentStatusText = (status: number) => {
        switch (status) {
            case 0: return 'Pending';
            case 1: return 'Partial';
            case 2: return 'Paid';
            default: return 'Unknown';
        }
    };

    const getTotalSpent = () => orders.reduce((sum, o) => sum + o.NetAmount, 0);
    const getAverageOrder = () => orders.length ? getTotalSpent() / orders.length : 0;

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy', err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-[#4e9767] border-gray-200"></div>
                <p className="mt-4 text-[#4e9767] text-lg">Loading customer details...</p>
            </div>
        );
    }

    if (error || !customer) {
        return (
            <div className="p-8 flex justify-center min-h-screen">
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-800 flex items-center gap-3 h-fit">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    <span>{error || 'Customer not found'}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 md:px-8 lg:px-40 flex flex-1 justify-center py-6 min-h-screen bg-[#f8fcf9]">
            <div className="layout-content-container flex flex-col max-w-5xl w-full flex-1 space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row items-start md:items-center gap-5 p-4 bg-white rounded-xl shadow-sm border border-[#e7f3eb]">
                    <Link to="/customers" className="text-[#4e9767] hover:text-[#0e1b12] flex items-center gap-1 text-lg font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        Back
                    </Link>

                    <div className="flex-1 flex items-center gap-4">
                        <div className="bg-[#d0e7d7] rounded-full w-16 h-16 flex items-center justify-center text-2xl font-bold text-[#0e1b12]">
                            {customer.Name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-[#0e1b12] text-3xl font-bold">{customer.Name}</h1>
                            <p className="text-[#4e9767] text-base">Customer since {formatDate(customer.CreatedDate)}</p>
                        </div>
                    </div>
                </header>

                {/* Statistics */}
                <section className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white border border-[#d0e7d7] rounded-xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-7 h-7 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg></div>
                        <div><p className="text-[#4e9767] text-sm font-medium">Total Orders</p><p className="text-[#0e1b12] text-2xl font-bold">{orders.length}</p></div>
                    </div>
                    <div className="bg-white border border-[#d0e7d7] rounded-xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-7 h-7 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <div><p className="text-[#4e9767] text-sm font-medium">Total Spent</p><p className="text-[#0e1b12] text-2xl font-bold">৳{getTotalSpent().toFixed(2)}</p></div>
                    </div>
                    <div className="bg-white border border-[#d0e7d7] rounded-xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-7 h-7 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-5-2h6m-3-8v12" /></svg></div>
                        <div><p className="text-[#4e9767] text-sm font-medium">Average Order</p><p className="text-[#0e1b12] text-2xl font-bold">৳{getAverageOrder().toFixed(2)}</p></div>
                    </div>
                </section>

                {/* Customer Info */}
                <section className="bg-white rounded-2xl border border-[#d0e7d7] p-6 md:p-8 shadow-sm">
                    <h2 className="text-[#0e1b12] text-2xl font-bold mb-6 flex items-center gap-3">
                        <svg className="w-7 h-7 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Customer Information
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fcf9] border border-[#d0e7d7]">
                            <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                            <div><p className="text-sm font-medium text-[#4e9767]">Full Name</p><p className="text-lg font-semibold text-[#0e1b12]">{customer.Name}</p></div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fcf9] border border-[#d0e7d7]">
                            <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></div>
                            <div className="flex-1 flex justify-between items-center">
                                <div><p className="text-sm font-medium text-[#4e9767]">Phone</p><p className="text-lg font-semibold text-[#0e1b12]">{customer.Phone}</p></div>
                                <button onClick={() => copyToClipboard(customer.Phone)} className="p-2 rounded-lg hover:bg-[#d0e7d7] text-[#4e9767]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#f8fcf9] border border-[#d0e7d7]">
                            <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                            <div className="flex-1 flex justify-between items-center">
                                <div><p className="text-sm font-medium text-[#4e9767]">Email</p><p className="text-lg font-semibold text-[#0e1b12]">{customer.Email || <span className="text-gray-400 italic">Not provided</span>}</p></div>
                                {customer.Email && <button onClick={() => copyToClipboard(customer.Email!)} className="p-2 rounded-lg hover:bg-[#d0e7d7] text-[#4e9767]"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>}
                            </div>
                        </div>
                        <div className="md:col-span-1 flex items-start gap-4 p-4 rounded-xl bg-[#f8fcf9] border border-[#d0e7d7]">
                            <div className="bg-[#e7f3eb] p-3 rounded-lg"><svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                            <div><p className="text-sm font-medium text-[#4e9767]">Address</p><p className="text-lg font-semibold text-[#0e1b12]">{customer.Address}</p></div>
                        </div>
                    </div>
                </section>

                {/* Order History */}
                <section className="bg-white rounded-xl border border-[#d0e7d7] shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#d0e7d7] flex items-center justify-between">
                        <h2 className="text-[#0e1b12] text-xl font-bold flex items-center gap-2">
                            <svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Order History
                        </h2>
                        <span className="text-sm text-[#4e9767]">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
                    </div>

                    {orders.length === 0 ? (
                        <div className="p-12 text-center text-[#9ca3af]">
                            <p className="text-lg">No orders found for this customer.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#f8fcf9]">
                                    <tr>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Order ID</th>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Date</th>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Total</th>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Discount</th>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Net</th>
                                        <th className="px-5 py-3 text-[#0e1b12] font-medium">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#e5e7eb]">
                                    {orders.map((order, i) => (
                                        <tr key={order.Id} className={`${i % 2 === 0 ? 'bg-[#fafafa]' : ''} hover:bg-green-50 cursor-pointer`} onClick={() => navigate(`/orders/${order.Id}`)}>
                                            <td className="px-5 py-4 font-medium">#{order.Id}</td>
                                            <td className="px-5 py-4 text-[#4e9767]">{formatDate(order.CreatedAt)}</td>
                                            <td className="px-5 py-4">৳{order.TotalAmount.toFixed(2)}</td>
                                            <td className="px-5 py-4 text-[#4e9767]">৳{order.Discount.toFixed(2)}</td>
                                            <td className="px-5 py-4 font-semibold">৳{order.NetAmount.toFixed(2)}</td>
                                            <td className="px-5 py-4">
                                                <span className={`flex min-w-[84px] max-w-[120px] items-center justify-center rounded-lg h-8 px-4 text-sm font-medium ${order.PaymentStatus === 2 ? 'bg-green-100 text-green-800' :
                                                    order.PaymentStatus === 1 ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                    }`}>
                                                    {getPaymentStatusText(order.PaymentStatus)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
