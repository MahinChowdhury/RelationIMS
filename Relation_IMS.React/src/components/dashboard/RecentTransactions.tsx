const RecentTransactions = () => {
  const transactions = [
    {
      id: '#ORD-2841',
      customer: 'Jamal Sheikh',
      initials: 'JS',
      avatarBg: 'bg-primary/10 text-primary',
      avatar: null,
      amount: '৳2,450',
      status: 'Completed',
      statusStyle: 'bg-primary/10 text-primary',
    },
    {
      id: '#ORD-2840',
      customer: 'Karim Ahmed',
      initials: null,
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBx1YL3C-COtoHxLOS4NGI2ANw5769IORk45jH5LT_ibqHQFPkZd_MVQvd7aouE1gFtjNutHMfWopZg_EZpXusEx2P-yBYSNuDw3-PG9lLZVxom9iT5jR1G2JQX3nBY5C50tB1-XkddNnjU4KwlblMaZv-cKizk7ITD7aTmnyeNkeHxQDw9IuFnQW8yhkPc-gYQs9W-SoX8jE4-Bgho7eL_YIt_nLtaRYOo_EFQhw2FtVbe3od4MYWGCpJbnBZU9v179ibzDX-ViYg',
      avatarBg: '',
      amount: '৳1,890',
      status: 'Processing',
      statusStyle: 'bg-gray-200 dark:bg-[#2a4032] text-gray-600 dark:text-gray-300',
    },
    {
      id: '#ORD-2839',
      customer: 'Rakibul Islam',
      initials: 'RI',
      avatarBg: 'bg-[#236c31]/10 text-[#236c31] dark:text-[#8dd890]',
      avatar: null,
      amount: '৳4,200',
      status: 'Completed',
      statusStyle: 'bg-primary/10 text-primary',
    },
  ];

  return (
    <div className="col-span-12 xl:col-span-8 bg-white dark:bg-[#1a2e22] rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[#2a4032] overflow-hidden">
      <div className="p-6 sm:p-8 flex justify-between items-center border-b border-gray-100 dark:border-[#2a4032]">
        <h4 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Recent Transactions</h4>
        <button className="text-xs font-bold text-primary flex items-center gap-1 hover:underline">
          View All <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[500px]">
          <thead className="bg-gray-50/50 dark:bg-[#203326]/50">
            <tr>
              <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Order ID</th>
              <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Customer</th>
              <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Amount</th>
              <th className="px-6 sm:px-8 py-3 sm:py-4 text-[10px] font-extrabold uppercase tracking-widest text-gray-500 dark:text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-[#2a4032]">
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td className="px-6 sm:px-8 py-4 sm:py-6 font-bold text-sm text-text-main dark:text-white">{tx.id}</td>
                <td className="px-6 sm:px-8 py-4 sm:py-6">
                  <div className="flex items-center gap-3">
                    {tx.avatar ? (
                      <img className="w-8 h-8 rounded-full object-cover" alt={tx.customer} src={tx.avatar} />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${tx.avatarBg} flex items-center justify-center text-[10px] font-bold`}>
                        {tx.initials}
                      </div>
                    )}
                    <span className="text-sm font-medium text-text-main dark:text-gray-200">{tx.customer}</span>
                  </div>
                </td>
                <td className="px-6 sm:px-8 py-4 sm:py-6 font-bold text-sm text-text-main dark:text-white">{tx.amount}</td>
                <td className="px-6 sm:px-8 py-4 sm:py-6">
                  <span className={`px-3 py-1 ${tx.statusStyle} text-[10px] font-extrabold uppercase rounded-full`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentTransactions;
