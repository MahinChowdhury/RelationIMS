import { useLanguage } from '../../i18n/LanguageContext';

const PaymentMethods = () => {
  const { t } = useLanguage();
  const methods = [
    { name: t.dashboard.mobileBanking, amount: 'à§³5,20,000', dotColor: 'bg-primary' },
    { name: t.dashboard.cash, amount: 'à§³2,80,000', dotColor: 'bg-[#4e9767]' },
    { name: t.dashboard.card, amount: 'à§³2,00,000', dotColor: 'bg-[#236c31]' },
  ];

  return (
    <div className="col-span-12 lg:col-span-4 bg-white dark:bg-[var(--color-surface-dark-card)] p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
      <h4 className="text-lg sm:text-xl font-extrabold tracking-tight mb-6 sm:mb-8 text-center text-text-main dark:text-white">{t.dashboard.paymentMethods}</h4>

      {/* Donut Chart */}
      <div className="relative flex justify-center mb-8 sm:mb-10">
        <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full border-[12px] border-gray-100 dark:border-[#203326] flex items-center justify-center relative">
          <div className="absolute inset-0 rounded-full border-[12px] border-primary border-t-transparent border-l-transparent rotate-[-20deg]"></div>
          <div className="absolute inset-0 rounded-full border-[12px] border-[#4e9767] border-t-transparent border-r-transparent border-b-transparent rotate-[100deg]"></div>
          <div className="absolute inset-0 rounded-full border-[12px] border-[#236c31] border-r-transparent border-b-transparent border-l-transparent rotate-[180deg]"></div>
          <div className="text-center">
            <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-gray-600">account_balance</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {methods.map((method) => (
          <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[var(--color-surface-dark-card)] rounded-2xl">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${method.dotColor}`}></div>
              <span className="text-sm font-bold text-text-main dark:text-gray-200">{method.name}</span>
            </div>
            <span className="text-sm font-extrabold text-text-main dark:text-white">{method.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentMethods;
