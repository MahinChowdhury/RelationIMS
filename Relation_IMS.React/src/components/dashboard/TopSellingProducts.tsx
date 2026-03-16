const TopSellingProducts = () => {
  const products = [
    { name: 'Formal Shirt', units: 120, percentage: 85, color: 'bg-primary', textColor: 'text-primary' },
    { name: 'Jeans Pant', units: 95, percentage: 65, color: 'bg-[#4e9767]', textColor: 'text-[#4e9767]' },
    { name: 'Polo Shirt', units: 80, percentage: 55, color: 'bg-[#236c31]', textColor: 'text-[#236c31] dark:text-[#8dd890]' },
  ];

  return (
    <div className="col-span-12 lg:col-span-7 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <div className="flex justify-between items-center mb-8 sm:mb-10">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Top Selling Products</h4>
        <select className="text-xs font-bold border-none bg-gray-50 dark:bg-[#203326] dark:text-gray-300 px-4 py-2 rounded-full focus:ring-0 cursor-pointer">
          <option>Last 30 Days</option>
          <option>This Quarter</option>
        </select>
      </div>
      <div className="space-y-6 sm:space-y-8">
        {products.map((product) => (
          <div key={product.name} className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-text-main dark:text-gray-200">
              <span>{product.name}</span>
              <span className={product.textColor}>{product.units} Units</span>
            </div>
            <div className="w-full h-7 sm:h-8 bg-gray-50 dark:bg-[#203326] rounded-xl overflow-hidden">
              <div className={`h-full ${product.color} rounded-r-xl transition-all duration-700`} style={{ width: `${product.percentage}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopSellingProducts;
