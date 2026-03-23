import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface TopSellingProduct {
  Id: number;
  ProductId: number;
  ProductName: string;
  ProductImageUrl?: string;
  TotalQuantitySold: number;
  TotalRevenue: number;
  PeriodType: number;
}

const TopSellingProducts = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState<TopSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'Last30Days' | 'ThisQuarter'>('Last30Days');

  useEffect(() => {
    fetchTopSellingProducts();
  }, [period]);

  const fetchTopSellingProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get<TopSellingProduct[]>('/topsellingproducts', {
        params: {
          period: period === 'Last30Days' ? 0 : 1,
          count: 20
        }
      });
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch top selling products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (index: number): number => {
    if (products.length === 0) return 0;
    const maxQuantity = Math.max(...products.map(p => p.TotalQuantitySold));
    if (maxQuantity === 0) return 0;
    return Math.round((products[index].TotalQuantitySold / maxQuantity) * 100);
  };

  const getColorClass = (index: number): string => {
    const colors = [
      'bg-primary',
      'bg-[#4e9767]',
      'bg-[#236c31]',
      'bg-[#5aad7d]',
      'bg-[#3d8b55]'
    ];
    return colors[index % colors.length];
  };

  const getTextColorClass = (index: number): string => {
    const colors = [
      'text-primary',
      'text-secondary',
      'text-[#236c31]',
      'text-[#5aad7d]',
      'text-[#3d8b55]'
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
      <div className="flex justify-between items-center mb-8 sm:mb-10">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">{t.dashboard.topSellingProducts}</h4>
        <select 
          className="text-xs font-bold border-none bg-gray-50 dark:bg-[var(--color-surface-dark-card)] dark:text-gray-300 px-4 py-2 rounded-full focus:ring-0 cursor-pointer"
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'Last30Days' | 'ThisQuarter')}
        >
          <option value="Last30Days">{t.dashboard.last30Days || 'Last 30 Days'}</option>
          <option value="ThisQuarter">{t.dashboard.thisQuarter || 'This Quarter'}</option>
        </select>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t.dashboard.noTopSellingProducts || 'No top selling products found'}</p>
        </div>
      ) : (
        <div className="space-y-6 sm:space-y-8 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {products.slice(0, 10).map((product, index) => (
            <div key={product.Id} className="space-y-2">
              <div className="flex justify-between text-sm font-bold text-text-main dark:text-gray-200">
                <span className="truncate flex-1 mr-4">{product.ProductName}</span>
                  <span className={getTextColorClass(index)}>{product.TotalQuantitySold} {t.dashboard.units}</span>
              </div>
              <div className="w-full h-7 sm:h-8 bg-gray-50 dark:bg-[var(--color-surface-dark-card)] rounded-xl overflow-hidden">
                <div 
                  className={`h-full ${getColorClass(index)} rounded-r-xl transition-all duration-700`} 
                  style={{ width: `${getPercentage(index)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopSellingProducts;
