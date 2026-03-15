const SalesOverview = () => {
  return (
    <section>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-primary mb-1">Performance Hub</p>
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">Sales Overview</h3>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-900 dark:bg-white/10 text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-gray-800 dark:hover:bg-white/20 transition-colors">
            Download Report
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Today Sales Card */}
        <div className="group relative overflow-hidden bg-primary text-white p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl shadow-primary/20">
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80 mb-2">Today Sales</p>
            <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter mb-4 sm:mb-6">৳12,500</h4>
            <div className="flex items-center gap-2 text-xs font-bold py-1 px-3 bg-white/20 backdrop-blur-md rounded-full w-fit">
              <span className="material-symbols-outlined text-[16px]">trending_up</span>
              <span>+14.2% from yesterday</span>
            </div>
          </div>
          <span className="material-symbols-outlined absolute -right-4 -bottom-4 text-[8rem] opacity-10 rotate-12" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
        </div>

        {/* This Week Card */}
        <div className="bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200/60 dark:border-[#2a4032] flex flex-col justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">This Week</p>
            <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">৳75,000</h4>
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
        </div>

        {/* This Month Card */}
        <div className="bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-gray-200/60 dark:border-[#2a4032] flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 dark:bg-primary/10 rounded-full -mr-16 -mt-16"></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">This Month</p>
            <h4 className="text-3xl sm:text-4xl font-extrabold tracking-tighter text-text-main dark:text-white">৳3,20,000</h4>
          </div>
          <div className="mt-6 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Target: ৳4,00,000</span>
            <span className="font-bold text-primary">80%</span>
          </div>
          <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-[#2a4032] rounded-full overflow-hidden">
            <div className="h-full bg-primary w-[80%] rounded-full"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SalesOverview;
