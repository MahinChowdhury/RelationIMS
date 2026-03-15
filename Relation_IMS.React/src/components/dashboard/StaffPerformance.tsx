const StaffPerformance = () => {
  const staff = [
    {
      name: 'Asif Khan',
      role: 'Sales Associate',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0yX_PXRRb6qWoC9oO-x0HXEOzJGjA6f6pRx3vnSrTGBrqUEi_L7lrW89P9AEwmjOFdLnLhwFq9lqVLRdFpS6pLu8NTikpqLyWCCKJG4OdnxaEZIcrYrd8VWhfoxY7o3dY35KlsiktsqIO_iMD2-AAXnGYaamzHD_q5qNFpWsf6MtkND1bw8XPkfYpkv-ipk3B_cTDWkOti1Al7VpFSwfgPWMed5gQiWMnh8ROdksPXplrnQ_FgFAr1HXNSe8k_kUTQbiyIYGvIbA',
      rank: 1,
      rankColor: 'bg-primary',
      sales: '৳82,400',
      salesColor: 'text-primary',
      count: '42 Sales',
    },
    {
      name: 'Nusrat Jahan',
      role: 'Inventory Lead',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPIgAB4svT5_OQZenLiTeP4qekwZ65e6qIUX117U2OARbJjJVSCIOA1KkSdsac8-hFvycvt-JCtkxUpvy-Mu8iutHBJ1I-glK2Sp8a9bMkan-r473Ilp-TvwR9G3tNny2stfQ7_M_35pdbMlc7hBVvonpKwZrAcmwHhLdEnAsuRSEaYdygBhOlBYpRKFfaMC85GCnUWSO9oRKjSN9jP-XXoJBJ4VtcRVdwl5l-bJlO8hSF5FX9NIHvBDwEPxYQeH6BUVNg6FUOaNs',
      rank: 2,
      rankColor: 'bg-[#4e9767]',
      sales: '৳65,100',
      salesColor: 'text-[#4e9767]',
      count: '31 Sales',
    },
  ];

  return (
    <div className="col-span-12 lg:col-span-5 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <div className="flex justify-between items-center mb-5 sm:mb-6">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Staff Performance</h4>
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Monthly Top</span>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {staff.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between p-3 sm:p-4 border border-gray-100 dark:border-[#2a4032] rounded-[1.5rem] sm:rounded-[2rem] hover:bg-gray-50 dark:hover:bg-[#203326] transition-colors"
          >
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <img
                  alt={member.name}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover"
                  src={member.avatar}
                />
                <div className={`absolute -top-1 -right-1 w-5 h-5 ${member.rankColor} rounded-full border-2 border-white dark:border-[#1a2e22] flex items-center justify-center`}>
                  <span className="text-[10px] text-white font-bold">{member.rank}</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-text-main dark:text-white">{member.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{member.role}</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-extrabold ${member.salesColor}`}>{member.sales}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{member.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StaffPerformance;
