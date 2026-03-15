const SalesByCategory = () => {
  const categories = [
    { name: 'Shirts', percentage: '45%', dotColor: 'bg-primary' },
    { name: 'Pants', percentage: '30%', dotColor: 'bg-[#4e9767]' },
    { name: 'Polos', percentage: '15%', dotColor: 'bg-[#236c31]' },
    { name: 'Others', percentage: '10%', dotColor: 'bg-gray-300 dark:bg-gray-500' },
  ];

  return (
    <div className="col-span-12 xl:col-span-4 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <h4 className="text-lg sm:text-xl font-extrabold tracking-tight mb-6 sm:mb-8 text-text-main dark:text-white">Sales by Category</h4>

      {/* Donut Chart */}
      <div className="relative flex justify-center mb-6 sm:mb-8">
        <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full border-[14px] sm:border-[16px] border-gray-100 dark:border-[#203326] flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-[14px] sm:border-[16px] border-primary border-t-transparent border-l-transparent rotate-[45deg]"></div>
          <div className="absolute inset-0 rounded-full border-[14px] sm:border-[16px] border-[#4e9767] border-t-transparent border-r-transparent border-b-transparent -rotate-[15deg]"></div>
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-extrabold text-text-main dark:text-white">2.4k</p>
            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Total Units</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${cat.dotColor}`}></div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{cat.name} ({cat.percentage})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesByCategory;
