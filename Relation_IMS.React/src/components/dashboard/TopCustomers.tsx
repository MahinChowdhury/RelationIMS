import { useState, useEffect } from 'react';
import api from '../../services/api';

interface TopCustomer {
  Id: number;
  CustomerId: number;
  CustomerName: string;
  CustomerImageUrl: string | null;
  TotalPurchases: number;
  TotalAmount: number;
  PeriodType: number;
}

const TopCustomers = () => {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopCustomers();
  }, []);

  const fetchTopCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get<TopCustomer[]>('/topcustomers', {
        params: { period: 0 }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch top customers:', error);
    } finally {
      setLoading(false);
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

  const getColorClass = (index: number): string => {
    const colors = [
      'bg-primary',
      'bg-[#4e9767]',
      'bg-[#236c31]',
      'bg-[#5aad7d]',
      'bg-[#3d8b55]',
      'bg-gray-400',
      'bg-orange-500',
      'bg-purple-500',
      'bg-blue-500',
      'bg-pink-500',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <h4 className="text-lg font-extrabold tracking-tight mb-5 sm:mb-6 text-text-main dark:text-white">Top Customers</h4>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No customer data found</p>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6 overflow-y-auto max-h-[420px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {customers.map((customer, index) => (
            <div key={customer.Id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {customer.CustomerImageUrl ? (
                  <img
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                    alt={customer.CustomerName}
                    src={customer.CustomerImageUrl}
                  />
                ) : (
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white text-sm font-bold ${getColorClass(index)}`}>
                    {getInitials(customer.CustomerName)}
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-text-main dark:text-white">{customer.CustomerName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{customer.TotalPurchases} Purchases</p>
                </div>
              </div>
              <p className="text-sm font-extrabold text-primary">{formatCurrency(customer.TotalAmount)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopCustomers;
