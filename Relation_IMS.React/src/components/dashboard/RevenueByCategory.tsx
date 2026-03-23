import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface RevenueCategory {
  Id: number;
  CategoryId: number;
  CategoryName: string;
  TotalRevenue: number;
  TotalQuantitySold: number;
  PeriodType: number;
}

const RevenueByCategory = () => {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<RevenueCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRevenueByCategory();
  }, []);

  const fetchRevenueByCategory = async () => {
    try {
      setLoading(true);
      const response = await api.get<RevenueCategory[]>('/revenuebycategory', {
        params: { period: 0 }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch revenue by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (index: number): number => {
    if (categories.length === 0) return 0;
    const maxRevenue = Math.max(...categories.map(c => c.TotalRevenue));
    if (maxRevenue === 0) return 0;
    return Math.round((categories[index].TotalRevenue / maxRevenue) * 100);
  };

  const getIcon = (categoryName: string): string => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('shirt') || name.includes('top') || name.includes('polo')) return 'checkroom';
    if (name.includes('pant') || name.includes('jean') || name.includes('trouser') || name.includes('pants')) return 'checkroom';
    if (name.includes('shoe') || name.includes('sneaker') || name.includes('boot')) return 'footprint';
    if (name.includes('bag') || name.includes('purse')) return 'shopping_bag';
    if (name.includes('watch')) return 'watch';
    if (name.includes('belt')) return 'belt';
    if (name.includes('cap') || name.includes('hat')) return 'face';
    return 'category';
  };

  const getColorClass = (index: number): { bg: string; text: string; bar: string } => {
    const colors = [
      { bg: 'bg-primary/10', text: 'text-primary', bar: 'bg-primary' },
      { bg: 'bg-[#4e9767]/10', text: 'text-secondary', bar: 'bg-[#4e9767]' },
      { bg: 'bg-[#236c31]/10', text: 'text-[#236c31] dark:text-[#8dd890]', bar: 'bg-[#236c31] dark:bg-[#8dd890]' },
      { bg: 'bg-[#5aad7d]/10', text: 'text-[#5aad7d]', bar: 'bg-[#5aad7d]' },
      { bg: 'bg-[#3d8b55]/10', text: 'text-[#3d8b55]', bar: 'bg-[#3d8b55]' },
      { bg: 'bg-gray-200/60 dark:bg-[#2a4032]', text: 'text-gray-500 dark:text-gray-400', bar: 'bg-gray-300 dark:bg-gray-500' },
      { bg: 'bg-orange-100 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', bar: 'bg-orange-500' },
      { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', bar: 'bg-purple-500' },
      { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
      { bg: 'bg-pink-100 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400', bar: 'bg-pink-500' },
    ];
    return colors[index % colors.length];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">{t.dashboard.revenueByCategory}</h4>
        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">bar_chart</span>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t.dashboard.noRevenueDataFound}</p>
        </div>
      ) : (
        <div className="space-y-5 sm:space-y-6 overflow-y-auto max-h-[420px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {categories.slice(0, 10).map((cat, index) => {
            const colors = getColorClass(index);
            return (
              <div key={cat.Id} className="flex items-center gap-3 sm:gap-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${colors.bg} flex items-center justify-center shrink-0`}>
                  <span className={`material-symbols-outlined text-xl sm:text-2xl ${colors.text}`}>{getIcon(cat.CategoryName)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-bold text-text-main dark:text-gray-200 truncate">{cat.CategoryName}</span>
                    <span className="text-sm font-extrabold text-text-main dark:text-white whitespace-nowrap ml-2">{formatCurrency(cat.TotalRevenue)}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-[var(--color-surface-dark-card)] rounded-full">
                    <div className={`h-full ${colors.bar} rounded-full transition-all duration-700`} style={{ width: `${getPercentage(index)}%` }}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RevenueByCategory;
