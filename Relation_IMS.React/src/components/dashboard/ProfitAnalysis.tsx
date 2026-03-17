const ProfitAnalysis = () => {
  return (
    <div className="col-span-12 lg:col-span-8 bg-gray-50 dark:bg-[#0f1f15] text-text-main dark:text-white p-6 sm:p-10 rounded-[2rem] sm:rounded-[2.5rem] relative overflow-hidden flex flex-col justify-center border border-gray-200/60 dark:border-[#2a4032]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 relative z-10">
        <div>
          <h4 className="text-sm font-extrabold uppercase tracking-widest text-primary mb-3 sm:mb-4">Profit Analysis</h4>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-3 sm:mb-4">
            ৳84,200{' '}
            <span className="text-base sm:text-lg font-medium text-gray-500 dark:text-gray-400 opacity-80">Net Profit</span>
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mb-5 sm:mb-6">
            Your profit margin increased by <span className="font-bold text-primary">8%</span> compared to last month due to lower logistics costs.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <div className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a2e22] rounded-full text-xs font-bold border border-gray-200 dark:border-[#2a4032] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span> Revenue: ৳320k
            </div>
            <div className="px-3 sm:px-4 py-2 bg-white dark:bg-[#1a2e22] rounded-full text-xs font-bold border border-gray-200 dark:border-[#2a4032] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0"></span> Expense: ৳235.8k
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="w-full aspect-[2/1] bg-gradient-to-br from-primary/20 to-[#4e9767]/10 rounded-2xl flex items-center justify-center border border-white/50 dark:border-white/10 backdrop-blur-sm">
            <div className="text-center">
              <span className="material-symbols-outlined text-4xl sm:text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
              <p className="text-xs font-bold mt-2 text-gray-500 dark:text-gray-400">Smart Forecasting: On Track</p>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-20 -right-20 w-60 sm:w-80 h-60 sm:h-80 bg-primary/10 rounded-full blur-[100px]"></div>
    </div>
  );
};

export default ProfitAnalysis;
