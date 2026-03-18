import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface Order {
  Id: number;
  CustomerId: number;
  Customer: {
    Name: string;
    Phone?: string;
  } | null;
  NetAmount: number;
  PaymentStatus: number;
  CreatedAt: string;
}

const RecentTransactions = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentOrders();
  }, []);

  const fetchRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/Order', {
        params: { pageSize: 5 }
      });
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch recent orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: number): { text: string; style: string } => {
    switch (status) {
      case 2: // Paid
        return { text: t.dashboard.completed, style: 'bg-primary/10 text-primary' };
      case 1: // Partial
        return { text: t.dashboard.processing, style: 'bg-gray-200 dark:bg-[#2a4032] text-gray-600 dark:text-gray-300' };
      case 0: // Pending
        return { text: t.dashboard.pending, style: 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' };
      default:
        return { text: t.dashboard.unknown, style: 'bg-gray-200 text-gray-600' };
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getInitials = (name: string): string => {
    return (name || '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarBg = (index: number): string => {
    const colors = [
      'bg-primary/10 text-primary',
      'bg-[#4e9767]/10 text-[#4e9767]',
      'bg-[#236c31]/10 text-[#236c31] dark:text-[#8dd890]',
      'bg-[#5aad7d]/10 text-[#5aad7d]',
      'bg-[#3d8b55]/10 text-[#3d8b55]',
    ];
    return colors[index % colors.length];
  };

  const handleViewAll = () => {
    navigate('/orders');
  };

  return (
    <div className="col-span-12 xl:col-span-8 bg-white dark:bg-[#1a2e22] rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032] overflow-hidden">
      <div className="p-6 sm:p-8 flex justify-between items-center border-b border-gray-100 dark:border-[#2a4032]">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">{t.dashboard.recentTransactions}</h4>
        <button 
          onClick={handleViewAll}
          className="text-xs font-bold text-primary flex items-center gap-1 hover:underline"
        >
          {t.dashboard.viewAll} <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t.dashboard.noRecentTransactionsFound}</p>
        </div>
      ) : (
        <div className="overflow-y-auto max-h-[420px] scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          <table className="w-full text-left min-w-[500px]">
            <thead className="bg-gray-50/50 dark:bg-[#203326]/50 sticky top-0 z-10">
              <tr>
                <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t.dashboard.orderId}</th>
                <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t.dashboard.customer}</th>
                <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t.dashboard.amount}</th>
                <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">{t.dashboard.status}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2a4032]">
              {orders.map((order, index) => {
                const statusInfo = getStatusInfo(order.PaymentStatus);
                const customerName = order.Customer?.Name || 'Unknown Customer';
                return (
                  <tr key={order.Id}>
                    <td className="px-6 sm:px-8 py-4 sm:py-6 font-bold text-sm text-text-main dark:text-white">#ORD-{order.Id}</td>
                    <td className="px-6 sm:px-8 py-4 sm:py-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full ${getAvatarBg(index)} flex items-center justify-center text-[10px] font-bold`}>
                          {getInitials(customerName)}
                        </div>
                        <span className="text-sm font-medium text-text-main dark:text-gray-200">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 sm:px-8 py-4 sm:py-6 font-bold text-sm text-text-main dark:text-white">{formatCurrency(order.NetAmount)}</td>
                    <td className="px-6 sm:px-8 py-4 sm:py-6">
                      <span className={`px-3 py-1 ${statusInfo.style} text-[10px] font-extrabold uppercase rounded-full`}>
                        {statusInfo.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RecentTransactions;
