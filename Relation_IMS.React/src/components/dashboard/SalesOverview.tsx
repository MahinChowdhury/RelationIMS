import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface SalesOverviewData {
  Id: number;
  PeriodType: number;
  TotalRevenue: number;
  OrderCount: number;
}

interface TodaySaleData {
  Date: string;
  TotalSales: number;
  OrderCount: number;
  YesterdaySales: number;
  PercentageChange: number;
}

const SalesOverview = () => {
  const { t } = useLanguage();
  const [thisWeek, setThisWeek] = useState<SalesOverviewData | null>(null);
  const [thisMonth, setThisMonth] = useState<SalesOverviewData | null>(null);
  const [todaySale, setTodaySale] = useState<TodaySaleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchSalesOverview();
    fetchTodaySale();
  }, []);

  const fetchSalesOverview = async () => {
    try {
      const response = await api.get<SalesOverviewData[]>('/salesoverview/all');
      const data = response.data;
      
      const weekData = data.find(d => d.PeriodType === 0);
      const monthData = data.find(d => d.PeriodType === 1);
      
      setThisWeek(weekData || null);
      setThisMonth(monthData || null);
    } catch (error) {
      console.error('Failed to fetch sales overview:', error);
    }
  };

  const fetchTodaySale = async () => {
    try {
      const response = await api.get<TodaySaleData>('/todaysale');
      setTodaySale(response.data);
    } catch (error) {
      console.error('Failed to fetch today sale:', error);
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

  const getMonthProgress = (): number => {
    if (!thisMonth) return 80;
    const target = 400000;
    return Math.min(Math.round((thisMonth.TotalRevenue / target) * 100), 100);
  };

  const getPercentageText = (): string => {
    if (!todaySale) return '+0%';
    const prefix = todaySale.PercentageChange >= 0 ? '+' : '';
    return `${prefix}${todaySale.PercentageChange}%`;
  };

  const getTrendIcon = (): string => {
    if (!todaySale) return 'trending_up';
    return todaySale.PercentageChange >= 0 ? 'trending_up' : 'trending_down';
  };

  const handleDownloadReport = async () => {
    try {
      setDownloading(true);
      const response = await api.get('/salesoverview/download', {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DashboardReport_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download report:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-1">{t.dashboard.performanceHub}</p>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">{t.dashboard.salesOverview}</h3>
        </div>
        <div className="flex gap-2">
                <button 
                  onClick={handleDownloadReport}
                  disabled={downloading}
                  className="px-4 py-2 bg-gray-900 dark:bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {downloading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
                  {t.dashboard.downloadReport}
                </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Today Sales Card */}
        <div className="group relative overflow-hidden bg-primary text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-primary/20">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : (
            <>
              <div className="relative z-10">
                <p className="text-sm font-medium opacity-80 mb-2">{t.dashboard.todaySales}</p>
                <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-4 sm:mb-6">
                  {formatCurrency(todaySale?.TotalSales || 0)}
                </h4>
                <div className="flex items-center gap-2 text-xs font-bold py-1 px-3 bg-white/20 backdrop-blur-md rounded-full w-fit">
                  <span className="material-symbols-outlined text-[16px]">{getTrendIcon()}</span>
                  <span>{getPercentageText()} {t.dashboard.fromYesterday}</span>
                </div>
                {todaySale && todaySale.OrderCount > 0 && (
                  <p className="text-[10px] opacity-60 mt-2">{todaySale.OrderCount} {todaySale.OrderCount !== 1 ? t.dashboard.orders : t.dashboard.orders} today</p>
                )}
              </div>
              <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[8rem] opacity-10 rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
            </>
          )}
        </div>

        {/* This Week Card */}
        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] flex flex-col justify-between">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.dashboard.thisWeek}</p>
                <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">
                  {formatCurrency(thisWeek?.TotalRevenue || 0)}
                </h4>
              </div>
              <div className="mt-6 h-12 flex items-end gap-1">
                {[40, 60, 30, 90, 50, 70, 45].map((h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-t-sm ${i === 3 ? 'bg-primary' : 'bg-gray-200 dark:bg-[#2a4032]'}`}
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* This Month Card */}
        <div className="bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -mr-16 -mt-16"></div>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.dashboard.thisMonth}</p>
                <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">
                  {formatCurrency(thisMonth?.TotalRevenue || 0)}
                </h4>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">{t.dashboard.target}: {formatCurrency(400000)}</span>
                <span className="font-bold text-primary">{getMonthProgress()}%</span>
              </div>
              <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-[#2a4032] rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${getMonthProgress()}%` }}></div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

export default SalesOverview;
