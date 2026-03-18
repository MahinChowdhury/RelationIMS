import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface StaffPerformanceData {
  UserId: number;
  FullName: string;
  Year: number;
  Month: number;
  TotalSales: number;
  OrderCount: number;
  Rank: number;
}

const StaffPerformance = () => {
  const { t } = useLanguage();
  const [staff, setStaff] = useState<StaffPerformanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    fetchStaffPerformance();
  }, [selectedYear, selectedMonth]);

  const fetchStaffPerformance = async () => {
    try {
      setLoading(true);
      const response = await api.get<StaffPerformanceData[]>('/staffperformance/monthly', {
        params: { year: selectedYear, month: selectedMonth }
      });
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff performance:', error);
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

  const getRankColor = (rank: number): string => {
    const colors: { [key: number]: string } = {
      1: 'bg-primary',
      2: 'bg-[#4e9767]',
      3: 'bg-[#236c31]',
    };
    return colors[rank] || 'bg-gray-400';
  };

  const getSalesColor = (rank: number): string => {
    const colors: { [key: number]: string } = {
      1: 'text-primary',
      2: 'text-[#4e9767]',
      3: 'text-[#236c31]',
    };
    return colors[rank] || 'text-gray-600 dark:text-gray-400';
  };

  const selectedMonthName = months.find(m => m.value === selectedMonth)?.label || '';

  return (
    <div className="col-span-12 lg:col-span-6 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-5 sm:mb-6">
        <div>
          <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">{t.dashboard.staffPerformance}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{selectedMonthName} {selectedYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#203326] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="text-xs sm:text-sm px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#203326] text-text-main dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[2024, 2025, 2026].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <p>{t.dashboard.noStaffPerformanceDataFound}</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
          {staff.map((member) => (
            <div
              key={member.UserId}
              className="flex items-center justify-between p-3 sm:p-4 border border-gray-100 dark:border-[#2a4032] rounded-[1.5rem] sm:rounded-[2rem] hover:bg-gray-50 dark:hover:bg-[#203326] transition-colors"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative">
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white text-sm font-bold ${getRankColor(member.Rank)}`}>
                    {getInitials(member.FullName)}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-5 h-5 ${getRankColor(member.Rank)} rounded-full border-2 border-white dark:border-[#1a2e22] flex items-center justify-center`}>
                    <span className="text-[10px] text-white font-bold">{member.Rank}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-text-main dark:text-white">{member.FullName}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{member.OrderCount} {t.dashboard.sales}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-extrabold ${getSalesColor(member.Rank)}`}>{formatCurrency(member.TotalSales)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPerformance;
