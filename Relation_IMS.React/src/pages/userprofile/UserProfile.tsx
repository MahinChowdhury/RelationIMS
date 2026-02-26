import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface UserInfo {
    name: string;
    email: string;
    phone: string;
    role: string;
    joinDate: string;
    avatar: string;
    currentSalary: number;
    address: string;
}

interface SalaryRecord {
    id: number;
    month: string;
    year: number;
    amount: number;
    status: 'paid' | 'pending';
    paidDate?: string;
}

interface StatCard {
    label: string;
    value: string;
    icon: string;
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function UserProfile() {
    const { t, language, setLanguage } = useLanguage();
    const [isEditing, setIsEditing] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [darkModeEnabled, setDarkModeEnabled] = useState(false);
    const [paySalaryModalOpen, setPaySalaryModalOpen] = useState(false);
    const [salaryForm, setSalaryForm] = useState({
        month: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        amount: 0,
        notes: ''
    });

    const userInfo: UserInfo = {
        name: 'Md Nasir',
        email: 'nasir@relation.com',
        phone: '+880 1234 567890',
        role: 'Manager',
        joinDate: 'January 2024',
        avatar: 'https://ui-avatars.com/api/?name=Md+Nasir&background=17cf54&color=fff',
        currentSalary: 45000,
        address: '123 Main Street, Dhaka 1200, Bangladesh'
    };

    const [salaryHistory, setSalaryHistory] = useState<SalaryRecord[]>([
        { id: 1, month: 'January', year: 2026, amount: 45000, status: 'paid', paidDate: '2026-01-31' },
        { id: 2, month: 'December', year: 2025, amount: 45000, status: 'paid', paidDate: '2025-12-31' },
        { id: 3, month: 'November', year: 2025, amount: 45000, status: 'paid', paidDate: '2025-11-30' },
        { id: 4, month: 'October', year: 2025, amount: 42000, status: 'paid', paidDate: '2025-10-31' },
        { id: 5, month: 'September', year: 2025, amount: 42000, status: 'paid', paidDate: '2025-09-30' },
        { id: 6, month: 'August', year: 2025, amount: 40000, status: 'paid', paidDate: '2025-08-31' },
    ]);

    const stats: StatCard[] = [
        { label: t.profile?.ordersHandled || 'Orders Handled', value: '1,234', icon: 'receipt_long' },
        { label: t.profile?.totalSales || 'Total Sales', value: '৳ 4.5M', icon: 'payments' },
        { label: t.profile?.thisMonth || 'This Month', value: '89', icon: 'calendar_month' },
        { label: t.profile?.lastLogin || 'Last Login', value: '2 hours ago', icon: 'schedule' },
    ];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'bn' : 'en');
    };

    const handlePaySalary = () => {
        const newRecord: SalaryRecord = {
            id: salaryHistory.length + 1,
            month: salaryForm.month,
            year: salaryForm.year,
            amount: salaryForm.amount,
            status: 'paid',
            paidDate: new Date().toISOString().split('T')[0]
        };
        setSalaryHistory([newRecord, ...salaryHistory]);
        setPaySalaryModalOpen(false);
        setSalaryForm({
            month: months[new Date().getMonth()],
            year: new Date().getFullYear(),
            amount: 0,
            notes: ''
        });
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#f6f8f6] dark:bg-[#112116] p-6 md:p-8">
            <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">

                {/* Header */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold text-[#0e1b12] dark:text-white">
                        {t.profile?.title || 'User Profile'}
                    </h1>
                    <p className="text-[#4e9767] dark:text-gray-400">
                        {t.profile?.subtitle || 'Manage your account settings and preferences'}
                    </p>
                </div>

                {/* Profile Header Card */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="w-28 h-28 rounded-2xl bg-center bg-cover border-4 border-[#17cf54]/20 shadow-lg"
                                style={{ backgroundImage: `url("${userInfo.avatar}")` }}
                            ></div>
                            <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-[#17cf54] hover:bg-[#12a542] rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 transition-all">
                                <span className="material-symbols-outlined text-white text-[18px]">camera_alt</span>
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold text-[#0e1b12] dark:text-white">{userInfo.name}</h2>
                                <span className="px-3 py-1 bg-[#17cf54]/10 text-[#17cf54] text-xs font-bold rounded-full self-center md:self-auto">
                                    {userInfo.role}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{userInfo.email}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs">
                                {t.profile?.memberSince || 'Member since'} {userInfo.joinDate}
                            </p>
                        </div>

                        {/* Edit Button */}
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                                isEditing 
                                    ? 'bg-[#17cf54] text-white shadow-lg shadow-green-500/20' 
                                    : 'bg-gray-100 dark:bg-white/10 text-[#0e1b12] dark:text-white hover:bg-gray-200 dark:hover:bg-white/15'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isEditing ? 'check' : 'edit'}</span>
                            {isEditing ? (t.profile?.save || 'Save') : (t.profile?.editProfile || 'Edit Profile')}
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-[#17cf54]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#17cf54]">{stat.icon}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[#0e1b12] dark:text-white mb-1">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Current Salary Card */}
                <div className="bg-gradient-to-r from-[#17cf54] to-[#12a542] rounded-2xl p-6 shadow-lg shadow-green-500/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-white/80 text-sm font-medium mb-1">{t.profile?.currentSalary || 'Current Salary'}</p>
                            <p className="text-4xl font-bold text-white">৳ {userInfo.currentSalary.toLocaleString()}</p>
                            <p className="text-white/70 text-xs mt-1">{t.profile?.perMonth || 'per month'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[32px]">account_balance_wallet</span>
                            </div>
                            <button 
                                onClick={() => {
                                    setSalaryForm(prev => ({ ...prev, amount: userInfo.currentSalary }));
                                    setPaySalaryModalOpen(true);
                                }}
                                className="px-5 py-3 bg-white text-[#17cf54] hover:bg-gray-100 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                            >
                                <span className="material-symbols-outlined text-[18px]">payments</span>
                                {t.profile?.paySalaryNow || 'Pay Salary Now'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Monthly Salary Tracker */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">calendar_month</span>
                            {t.profile?.salaryHistory || 'Salary History'}
                        </h3>
                        <span className="text-xs text-gray-400">{salaryHistory.length} {t.profile?.records || 'records'}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {salaryHistory.map((record) => (
                            <div key={record.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                        record.status === 'paid' 
                                            ? 'bg-[#17cf54]/10' 
                                            : 'bg-yellow-500/10'
                                    }`}>
                                        <span className={`material-symbols-outlined ${
                                            record.status === 'paid' 
                                                ? 'text-[#17cf54]' 
                                                : 'text-yellow-500'
                                        }`}>
                                            {record.status === 'paid' ? 'check_circle' : 'schedule'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#0e1b12] dark:text-white">{record.month} {record.year}</p>
                                        <p className="text-xs text-gray-400">
                                            {record.status === 'paid' 
                                                ? `${t.profile?.paidOn || 'Paid on'} ${record.paidDate}` 
                                                : t.profile?.pending || 'Pending'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#0e1b12] dark:text-white">৳ {record.amount.toLocaleString()}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                                        record.status === 'paid'
                                            ? 'bg-[#17cf54]/10 text-[#17cf54]'
                                            : 'bg-yellow-500/10 text-yellow-500'
                                    }`}>
                                        {record.status === 'paid' ? (t.profile?.paid || 'Paid') : (t.profile?.pending || 'Pending')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Personal Information Card */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">person</span>
                            {t.profile?.personalInfo || 'Personal Information'}
                        </h3>
                    </div>
                    <div className="p-5 grid gap-5">
                        <div className="grid md:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">{t.common.name}</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.name}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">{t.common.phone}</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.phone}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">{t.common.email}</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.email}</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.role || 'Role'}</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.role}</p>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.address || 'Address'}</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.address}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings Card */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54]">settings</span>
                            {t.profile?.accountSettings || 'Account Settings'}
                        </h3>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex items-center justify-between p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">lock</span>
                                <div>
                                    <p className="font-medium text-[#0e1b12] dark:text-white text-sm">{t.profile?.changePassword || 'Change Password'}</p>
                                    <p className="text-xs text-gray-400">{t.profile?.lastChanged || 'Last changed: 30 days ago'}</p>
                                </div>
                            </div>
                            <button className="p-2 text-[#17cf54] hover:bg-[#17cf54]/10 rounded-lg transition-colors">
                                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">notifications</span>
                                <div>
                                    <p className="font-medium text-[#0e1b12] dark:text-white text-sm">{t.profile?.notifications || 'Notifications'}</p>
                                    <p className="text-xs text-gray-400">{t.profile?.notifDesc || 'Order updates, alerts, and more'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-[#17cf54]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notificationsEnabled ? 'right-1' : 'left-1'}`}></span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">dark_mode</span>
                                <div>
                                    <p className="font-medium text-[#0e1b12] dark:text-white text-sm">{t.profile?.darkMode || 'Dark Mode'}</p>
                                    <p className="text-xs text-gray-400">{t.profile?.darkModeDesc || 'Use dark theme'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setDarkModeEnabled(!darkModeEnabled)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${darkModeEnabled ? 'bg-[#17cf54]' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${darkModeEnabled ? 'right-1' : 'left-1'}`}></span>
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3">
                                <span className="material-symbols-outlined text-gray-500">translate</span>
                                <div>
                                    <p className="font-medium text-[#0e1b12] dark:text-white text-sm">{t.profile?.language || 'Language'}</p>
                                    <p className="text-xs text-gray-400">{language === 'en' ? 'English' : 'বাংলা'}</p>
                                </div>
                            </div>
                            <button
                                onClick={toggleLanguage}
                                className={`relative flex items-center p-1 rounded-full w-[120px] h-[36px] cursor-pointer shrink-0 shadow-inner transition-colors duration-300 border ${language === 'en' ? 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50' : 'bg-sky-100/50 dark:bg-sky-900/20 border-sky-200/50 dark:border-sky-800/50'}`}
                                aria-label="Toggle Language"
                            >
                                <div
                                    className={`absolute left-1 shadow-md w-[54px] h-[28px] rounded-full transition-all duration-300 ${language === 'bn' ? 'translate-x-[54px] bg-sky-500' : 'translate-x-0 bg-blue-500'}`}
                                ></div>
                                <span className={`relative z-10 w-1/2 text-center text-[11px] font-bold transition-colors duration-300 ${language === 'en' ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    English
                                </span>
                                <span className={`relative z-10 w-1/2 text-center text-[11px] font-bold transition-colors duration-300 ${language === 'bn' ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                    বাংলা
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Pay Salary Modal */}
                {paySalaryModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#17cf54]">payments</span>
                                    {t.profile?.paySalary || 'Pay Salary'}
                                </h2>
                                <button 
                                    onClick={() => setPaySalaryModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-gray-500">close</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl mb-6">
                                <div className="w-12 h-12 rounded-xl bg-[#17cf54]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[#17cf54]">person</span>
                                </div>
                                <div>
                                    <p className="font-bold text-[#0e1b12] dark:text-white">{userInfo.name}</p>
                                    <p className="text-xs text-gray-400">{userInfo.role}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.selectMonth || 'Month'}</label>
                                        <select
                                            value={salaryForm.month}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, month: e.target.value })}
                                            className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                        >
                                            {months.map((month) => (
                                                <option key={month} value={month}>{month}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.selectYear || 'Year'}</label>
                                        <select
                                            value={salaryForm.year}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, year: parseInt(e.target.value) })}
                                            className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                        >
                                            {[2026, 2025, 2024, 2023].map((year) => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.salaryAmount || 'Amount'}</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">৳</span>
                                        <input
                                            type="number"
                                            value={salaryForm.amount}
                                            onChange={(e) => setSalaryForm({ ...salaryForm, amount: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl pl-8 pr-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.notes || 'Notes'} ({t.common.optional || 'Optional'})</label>
                                    <textarea
                                        value={salaryForm.notes}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                                        placeholder={t.profile?.notesPlaceholder || 'Add any notes...'}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium focus:ring-[#17cf54] focus:border-[#17cf54] resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setPaySalaryModalOpen(false)}
                                    className="flex-1 py-3 text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    {t.common.cancel}
                                </button>
                                <button
                                    onClick={handlePaySalary}
                                    className="flex-1 py-3 bg-[#17cf54] hover:bg-[#12a542] text-white font-bold rounded-xl shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    {t.profile?.paySalary || 'Pay Salary'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                <button className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                    <span className="material-symbols-outlined">logout</span>
                    {t.profile?.logout || 'Log Out'}
                </button>

            </div>
        </div>
    );
}
