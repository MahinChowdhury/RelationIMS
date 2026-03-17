import { useState, useEffect } from 'react';
import api from '../../services/api';

interface SalesCategory {
  Id: number;
  CategoryId: number;
  CategoryName: string;
  TotalRevenue: number;
  TotalQuantitySold: number;
  PeriodType: number;
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
    const totalUnits = categories.reduce((sum, c) => sum + c.TotalQuantitySold, 0);
    if (totalUnits === 0) return 0;
    return Math.round((categories[index].TotalQuantitySold / totalUnits) * 100);
  };

  const getColorHex = (index: number): string => {
    const colors = [
      '#2563eb', // bg-primary (blue)
      '#4e9767',
      '#236c31',
      '#5aad7d',
      '#3d8b55',
      '#9ca3af', // gray-400
      '#f97316', // orange-500
      '#a855f7', // purple-500
      '#3b82f6', // blue-500
      '#ec4899', // pink-500
    ];
    return colors[index % colors.length];
  };

  const getConicGradient = (): string => {
    if (categories.length === 0) return 'transparent';
    
    const totalUnits = categories.reduce((sum, c) => sum + c.TotalQuantitySold, 0);
    if (totalUnits === 0) return 'transparent';

    let gradient = 'conic-gradient(';
    let currentDegree = 0;

    categories.slice(0, 10).forEach((cat, index) => {
      const percentage = (cat.TotalQuantitySold / totalUnits) * 100;
      if (percentage > 0) {
        const startDegree = currentDegree;
        const endDegree = currentDegree + (percentage * 3.6); // 3.6 degrees per percentage point
        const color = getColorHex(index);
        
        if (index > 0) gradient += ', ';
        gradient += `${color} ${startDegree}deg ${endDegree}deg`;
        currentDegree = endDegree;
      }
    });

    gradient += ')';
    return gradient;
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-BD').format(num);
  };

  const totalUnits = categories.reduce((sum, c) => sum + c.TotalQuantitySold, 0);

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
            <div 
              className="w-40 h-40 sm:w-48 sm:h-48 rounded-full flex items-center justify-center relative"
              style={{ 
                background: getConicGradient(),
                padding: '16px'
              }}
            >
              <div 
                className="w-full h-full rounded-full bg-white dark:bg-[#1a2e22] flex items-center justify-center"
              >
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-extrabold text-text-main dark:text-white">{formatNumber(totalUnits)}</p>
                  <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Total Units</p>
                </div>
              </div>
            </div>
          </div>

          {/* Legend - Scrollable */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
            {categories.slice(0, 10).map((cat, index) => (
              <div key={cat.Id} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getColorHex(index) }}
                ></div>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                  {cat.CategoryName} ({getPercentage(index)}%)
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
