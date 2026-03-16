const TopCustomers = () => {
  const customers = [
    {
      name: 'Tanvir Rahman',
      purchases: '24 Purchases',
      amount: '৳42,000',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA0yX_PXRRb6qWoC9oO-x0HXEOzJGjA6f6pRx3vnSrTGBrqUEi_L7lrW89P9AEwmjOFdLnLhwFq9lqVLRdFpS6pLu8NTikpqLyWCCKJG4OdnxaEZIcrYrd8VWhfoxY7o3dY35KlsiktsqIO_iMD2-AAXnGYaamzHD_q5qNFpWsf6MtkND1bw8XPkfYpkv-ipk3B_cTDWkOti1Al7VpFSwfgPWMed5gQiWMnh8ROdksPXplrnQ_FgFAr1HXNSe8k_kUTQbiyIYGvIbA',
    },
    {
      name: 'Sumaiya Akhter',
      purchases: '18 Purchases',
      amount: '৳35,500',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCPIgAB4svT5_OQZenLiTeP4qekwZ65e6qIUX117U2OARbJjJVSCIOA1KkSdsac8-hFvycvt-JCtkxUpvy-Mu8iutHBJ1I-glK2Sp8a9bMkan-r473Ilp-TvwR9G3tNny2stfQ7_M_35pdbMlc7hBVvonpKwZrAcmwHhLdEnAsuRSEaYdygBhOlBYpRKFfaMC85GCnUWSO9oRKjSN9jP-XXoJBJ4VtcRVdwl5l-bJlO8hSF5FX9NIHvBDwEPxYQeH6BUVNg6FUOaNs',
    },
    {
      name: 'Mahmud Hasan',
      purchases: '15 Purchases',
      amount: '৳28,900',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOWIipFDYJ27dNsuNCgzGvCkwDrKz5QpkYxXGUCbz4imiZvx327qlOAJR2bTq7Uvs3F7T2-jKp1_SDTL2umJj3f-wyjp-O7RPNSFN9aR3Lp_4HB3-YRfHUg_jy8OvlYKbc8Tl04Y-n-pZOAlSQz3Cz8W9khHdOQ7hySLGfNzQRxP398y2nyJ6_qCvAHf0zVZl4KTD4uRgXAJkGYu4NtQaQqGqSGFIyW6CALM87CMdgkUy-gy6vxO-W3Sc1l__yXGNHarMMzKO0_vU',
    },
  ];

  return (
    <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[#1a2e22] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032]">
      <h4 className="text-lg font-extrabold tracking-tight mb-5 sm:mb-6 text-text-main dark:text-white">Top Customers</h4>
      <div className="space-y-5 sm:space-y-6">
        {customers.map((customer) => (
          <div key={customer.name} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover"
                alt={customer.name}
                src={customer.avatar}
              />
              <div>
                <p className="text-sm font-bold text-text-main dark:text-white">{customer.name}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{customer.purchases}</p>
              </div>
            </div>
            <p className="text-sm font-extrabold text-primary">{customer.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopCustomers;
