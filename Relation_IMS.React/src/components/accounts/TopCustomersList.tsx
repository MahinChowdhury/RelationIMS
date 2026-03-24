import type { TopCustomer } from '../../pages/accounts/mockData';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
};

// Generate a deterministic color from initials
const getAvatarColor = (name: string): string => {
    const colors = [
        'bg-primary/20 text-primary',
        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
        'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
        'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
        'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};

interface TopCustomersListProps {
    data: TopCustomer[];
}

const TopCustomersList = ({ data }: TopCustomersListProps) => {
    return (
        <section className="bg-white dark:bg-[var(--color-surface-dark-card)] p-5 sm:p-8 rounded-xl shadow-sm border border-gray-200/60 dark:border-[var(--color-surface-dark-border)]">
            <div className="flex justify-between items-center mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-text-main dark:text-white">Top Customers by Revenue</h2>
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-600">groups</span>
            </div>
            <div className="space-y-2 sm:space-y-4">
                {data.map((customer, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] rounded-xl transition-all group"
                    >
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm ${getAvatarColor(customer.name)}`}>
                                {customer.avatar}
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-text-main dark:text-white">{customer.name}</h4>
                                <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-widest">{customer.tier}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-extrabold text-text-main dark:text-white">{formatCurrency(customer.revenue)}</p>
                            <p className="text-[9px] sm:text-[10px] text-primary font-bold uppercase tracking-widest">{customer.orders} Orders</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="w-full mt-4 sm:mt-6 py-3 sm:py-4 border-2 border-gray-100 dark:border-[var(--color-surface-dark-border)] rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-gray-600 transition-all">
                View CRM Analytics
            </button>
        </section>
    );
};

export default TopCustomersList;
