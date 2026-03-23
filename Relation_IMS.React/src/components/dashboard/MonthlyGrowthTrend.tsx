const MonthlyGrowthTrend = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const dataPointOffsets = [20, 40, 60, 55, 80, 90];

  return (
    <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)] relative overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 sm:mb-8 relative z-10 gap-3">
        <div>
          <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Monthly Growth Trend</h4>
          <p className="text-xs text-gray-400 dark:text-gray-500">Last 6 Months Revenue</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary font-bold text-xs w-fit">
          <span className="material-symbols-outlined text-sm">trending_up</span>
          <span>+22% Growth</span>
        </div>
      </div>
      <div className="h-48 sm:h-64 flex items-end justify-between relative px-2 sm:px-4">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex flex-col justify-between py-4 opacity-[0.05] dark:opacity-[0.08] pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-t border-gray-900 dark:border-white"></div>
          ))}
        </div>

        {/* Trend Line SVG */}
        <svg className="absolute inset-0 w-full h-full p-4" preserveAspectRatio="none" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="dashGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#17cf54" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#17cf54" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 0 80 Q 20 70, 20 60 T 40 40 T 60 45 T 80 20 T 100 10"
            fill="none"
            stroke="#17cf54"
            strokeLinecap="round"
            strokeWidth="3"
          />
          <path
            d="M 0 80 Q 20 70, 20 60 T 40 40 T 60 45 T 80 20 T 100 10 L 100 100 L 0 100 Z"
            fill="url(#dashGrad)"
          />
        </svg>

        {/* X-Axis Labels */}
        <div className="absolute bottom-[-20px] sm:bottom-[-24px] left-0 right-0 flex justify-between px-2 sm:px-4 text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        {/* Data Points */}
        <div className="relative z-10 w-full flex justify-between items-end h-full">
          {dataPointOffsets.map((offset, i) => (
            <div key={i} className="group relative">
              <div
                className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-white dark:bg-[var(--color-surface-dark-card)] border-2 border-primary rounded-full"
                style={{ transform: `translateY(-${offset}px)` }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyGrowthTrend;
