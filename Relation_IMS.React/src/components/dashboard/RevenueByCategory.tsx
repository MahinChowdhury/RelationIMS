const RevenueByCategory = () => {
  const categories = [
    { name: 'Shirts', amount: '৳1,45,000', percentage: 45, icon: 'apparel', color: 'bg-primary/10 text-primary', barColor: 'bg-primary' },
    { name: 'Pants', amount: '৳96,000', percentage: 30, icon: 'checkroom', color: 'bg-[#4e9767]/10 text-[#4e9767]', barColor: 'bg-[#4e9767]' },
    { name: 'T-Shirts', amount: '৳48,000', percentage: 15, icon: 'dry_cleaning', color: 'bg-[#236c31]/10 text-[#236c31] dark:text-[#8dd890]', barColor: 'bg-[#236c31] dark:bg-[#8dd890]' },
    { name: 'Polos', amount: '৳31,000', percentage: 10, icon: 'styler', color: 'bg-gray-200/60 dark:bg-[#2a4032] text-gray-500 dark:text-gray-400', barColor: 'bg-gray-300 dark:bg-gray-500' },
  ];

  return (
    <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <div className="flex justify-between items-center mb-6 sm:mb-8">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Revenue by Category</h4>
        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">bar_chart</span>
      </div>
      <div className="space-y-5 sm:space-y-6">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${cat.color} flex items-center justify-center shrink-0`}>
              <span className="material-symbols-outlined text-xl sm:text-2xl">{cat.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-bold text-text-main dark:text-gray-200">{cat.name}</span>
                <span className="text-sm font-extrabold text-text-main dark:text-white">{cat.amount}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-[#203326] rounded-full">
                <div className={`h-full ${cat.barColor} rounded-full transition-all duration-700`} style={{ width: `${cat.percentage}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueByCategory;
