import { useState, useEffect } from 'react';
import api from '../../services/api';

interface SalesCategory {
  id: number;
  categoryId: number;
  categoryName: string;
  totalRevenue: number;
  totalQuantitySold: number;
  periodType: number;
}

const SalesByCategory = () => {
  const [categories, setCategories] = useState<SalesCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesByCategory();
  }, []);

  const fetchSalesByCategory = async () => {
    try {
      setLoading(true);
      const response = await api.get<SalesCategory[]>('/revenuebycategory', {
        params: { period: 0 }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch sales by category:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPercentage = (index: number): number => {
    if (categories.length === 0) return 0;
    const totalUnits = categories.reduce((sum, c) => sum + c.totalQuantitySold, 0);
    if (totalUnits === 0) return 0;
    return Math.round((categories[index].totalQuantitySold / totalUnits) * 100);
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

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const totalUnits = categories.reduce((sum, c) => sum + c.totalQuantitySold, 0);

  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <h4 className="text-lg sm:text-xl font-extrabold tracking-tight mb-6 sm:mb-8 text-text-main dark:text-white">Sales by Category</h4>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>No sales data found</p>
        </div>
      ) : (
        <>
          {/* Donut Chart */}
          <div className="relative flex justify-center mb-6 sm:mb-8">
            <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[14px] sm:border-[16px] border-gray-100 dark:border-[#203326] flex items-center justify-center relative bg-white dark:bg-[#1a2e22]">
              {/* Segments would be complex to implement with pure CSS, showing center instead */}
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-extrabold text-text-main dark:text-white">{formatNumber(totalUnits)}</p>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Total Units</p>
              </div>
            </div>
          </div>

          {/* Legend - Scrollable */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {categories.slice(0, 10).map((cat, index) => (
              <div key={cat.id} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getColorClass(index)}`}></div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {cat.categoryName} ({getPercentage(index)}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default SalesByCategory;
