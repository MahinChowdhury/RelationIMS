import { useState, useEffect } from 'react';
import api from '../../services/api';

interface InventoryValueData {
  id: number;
  totalItems: number;
  totalValue: number;
  lastMonthValue: number;
}

const EstimatedInventoryValue = () => {
  const [data, setData] = useState<InventoryValueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryValue();
  }, []);

  const fetchInventoryValue = async () => {
    try {
      setLoading(true);
      const response = await api.get<InventoryValueData>('/inventoryvalue');
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory value:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
      return `৳${(amount / 10000000).toFixed(1)}M`;
    } else if (amount >= 100000) {
      return `৳${(amount / 100000).toFixed(1)}L`;
    } else if (amount >= 1000) {
      return `৳${(amount / 1000).toFixed(1)}K`;
    }
    return `৳${amount}`;
  };

  const calculateGrowth = (): number => {
    if (!data || data.lastMonthValue === 0) return 0;
    return ((data.totalValue - data.lastMonthValue) / data.lastMonthValue) * 100;
  };

  const growth = calculateGrowth();

  return (
    <div className="col-span-12 lg:col-span-6 bg-[#1a2e22] dark:bg-[#0a1a10] text-white p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] flex items-center justify-between">
      {loading ? (
        <div className="flex items-center justify-center w-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : (
        <>
          <div>
            <p className="text-xs font-medium opacity-60 uppercase tracking-widest mb-1">Estimated Value</p>
            <h4 className="text-2xl sm:text-3xl font-extrabold tracking-tighter">{formatCurrency(data?.totalValue || 0)}</h4>
            <p className="text-[10px] text-primary mt-1 font-bold">
              {growth >= 0 ? '+' : ''}{growth.toFixed(1)}% Inventory Growth
            </p>
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl sm:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_balance_wallet</span>
          </div>
        </>
      )}
    </div>
  );
};

export default EstimatedInventoryValue;
