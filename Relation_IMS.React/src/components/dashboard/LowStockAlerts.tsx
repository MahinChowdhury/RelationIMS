const LowStockAlerts = () => {
  return (
    <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 sm:gap-6">
      {/* Urgent Alert */}
      <div className="flex-1 bg-red-50/60 dark:bg-red-900/15 p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-red-200/30 dark:border-red-800/20 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
            <span className="text-xs font-extrabold uppercase tracking-widest">Urgent Alerts</span>
          </div>
          <h4 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-4 text-red-900 dark:text-red-200">L-Size Blue Shirt</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
            <p className="text-sm font-medium text-red-800/70 dark:text-red-200/70">
              Only <span className="text-red-600 dark:text-red-400 font-extrabold">2 LEFT</span> in stock
            </p>
            <button className="px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 dark:bg-red-500 text-white rounded-full text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-red-600/20 hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
              Reorder Now
            </button>
          </div>
        </div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default LowStockAlerts;
