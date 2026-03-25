import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { signalRService } from '../../services/signalR';
import { audioService } from '../../services/audio';
import { useLanguage } from '../../i18n/LanguageContext';
import type { Order } from '../../types';
import { OrderInternalStatus } from '../../types';

export default function Arrangement() {
    const { t } = useLanguage();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLive, setIsLive] = useState(false);
    const prevOrderCountRef = useRef<number>(0);

    useEffect(() => {
        fetchOrders();
        
        signalRService.connect().then(() => {
            setIsLive(true);
        });

        const unsubscribe = signalRService.onOrderListUpdate(async () => {
            console.log('[Arrangement] SignalR OrderListUpdated received, fetching fresh orders...');
            const previousCount = prevOrderCountRef.current;
            try {
                const newOrders = await fetchOrders();
                console.log(`[Arrangement] Fetched ${newOrders.length} orders (was ${previousCount})`);
                if (newOrders && newOrders.length > previousCount) {
                    audioService.playNotification();
                }
            } catch (err) {
                console.error('[Arrangement] Failed to fetch orders on SignalR update:', err);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const fetchOrders = async (): Promise<Order[]> => {
        try {
            setLoading(true);
            const res = await api.get<Order[]>('/Arrangement/orders');
            const activeOrders = res.data.filter(o => o.InternalStatus !== OrderInternalStatus.Confirmed);
            prevOrderCountRef.current = activeOrders.length;
            setOrders(activeOrders);
            return activeOrders;
        } catch (err) {
            console.error("Failed to load arrangement orders", err);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: OrderInternalStatus) => {
        switch (status) {
            case OrderInternalStatus.Created:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">{t.common.new || 'New'}</span>;
            case OrderInternalStatus.Arranging:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">{t.common.inProgress || 'In Progress'}</span>;
            case OrderInternalStatus.Arranged:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">{t.common.completed || 'Completed'}</span>;
            case OrderInternalStatus.Confirmed:
                return <span className="px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">{t.orders.confirmed || 'Confirmed'}</span>;
            default:
                return null;
        }
    };

    return (
        <div className="flex-1 w-full max-w-[1600px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-6 font-display text-text-main dark:text-gray-100">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                {/* LEFT: Title + Subtitle */}
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-text-main dark:text-white tracking-tight flex items-center gap-3">
                        <span className="material-symbols-outlined text-4xl text-primary">conveyor_belt</span>
                        {t.arrangement.orderArrangement}
                    </h1>
                    <p className="text-text-secondary dark:text-gray-400 text-sm md:text-base mt-2">
                        {t.arrangement.subtitle}
                    </p>
                </div>

                {/* RIGHT: Wrapper */}
                <div className="flex flex-col items-end gap-2 md:gap-3 md:pr-36">
                    
                    {/* Inner row (Live + Refresh) */}
                    <div className="flex items-center gap-3">
                        {isLive && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-xs font-medium text-green-700 dark:text-green-400">
                                <span className="size-2 bg-green-500 rounded-full animate-pulse"></span>
                                Live
                            </div>
                        )}

                        <button
                            onClick={fetchOrders}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-bold shadow-sm hover:shadow transition-shadow"
                        >
                            <span className="material-symbols-outlined text-primary">refresh</span>
                            {t.common.refresh || 'Refresh'}
                        </button>
                    </div>

                </div>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-[#e7f3eb] dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-400 animate-pulse">
                        {t.orders.loadingOrders || 'Loading orders...'}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-3">
                            <span className="material-symbols-outlined text-5xl opacity-20">checklist</span>
                            <p className="font-medium">{t.orders.noPendingOrders || 'No pending orders found.'}</p>
                            <p className="text-xs max-w-xs mx-auto text-gray-500">{t.orders.allOrdersArranged || 'All orders have been arranged or no new orders available.'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">{t.orders.orderId || 'Order ID'}</th>
                                    <th className="px-6 py-4">{t.common.customer || 'Customer'}</th>
                                    <th className="px-6 py-4">{t.common.date || 'Date'}</th>
                                    <th className="px-6 py-4">{t.common.items || 'Items'}</th>
                                    <th className="px-6 py-4 text-center">{t.common.status || 'Status'}</th>
                                    <th className="px-6 py-4 text-right">{t.common.action || 'Action'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#f0f7f2] dark:divide-gray-700">
                                {orders.map((order) => (
                                    <tr key={order.Id} className="hover:bg-green-50/50 dark:hover:bg-green-900/10 transition-colors group">
                                        <td className="px-6 py-4 font-mono font-bold text-text-main dark:text-white">#{order.Id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-text-main dark:text-white">{order.Customer?.Name || 'Guest'}</span>
                                                <span className="text-xs text-text-secondary">{order.Customer?.Phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(order.CreatedAt).toLocaleDateString()}
                                            <span className="text-xs block text-gray-400">{new Date(order.CreatedAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 font-medium text-xs">
                                                <span className="material-symbols-outlined text-sm">shopping_bag</span>
                                                {order.OrderItems?.length || 0} {t.common.items || 'items'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(order.InternalStatus)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                to={`/arrangement/${order.Id}`}
                                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark transition-colors shadow-sm shadow-primary/30"
                                            >
                                                {t.orders.startArranging || 'Start Arranging'}
                                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
