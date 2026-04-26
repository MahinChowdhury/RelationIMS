import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getUserProfile, getSalaryRecords, addSalaryRecord, updateUserProfile, changePassword, type UserProfileDTO, type SalaryRecordDTO } from '../../services/userService';
import { getAllInventories } from '../../services/InventoryService';
import type { Inventory } from '../../types';
import LogoutConfirmModal from '../../components/LogoutConfirmModal';
import { QuantityInput } from '../../components/QuantityInput';

interface UserInfo {
    name: string;
    email: string;
    phone: string;
    role: string;
    joinDate: string;
    avatar: string;
    currentSalary: number;
    address: string;
    shopName: string;
}



interface StatCard {
    label: string;
    value: string;
    icon: string;
}

const taka = '\u09F3';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function UserProfile() {
    const { t, language, setLanguage } = useLanguage();
    const { id } = useParams();
    const { user: currentUser, logout } = useAuth();

    const [profileData, setProfileData] = useState<UserProfileDTO | null>(null);
    const [salaryHistory, setSalaryHistory] = useState<SalaryRecordDTO[]>([]);
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const { theme, setTheme, isDark } = useTheme();
    const [paySalaryModalOpen, setPaySalaryModalOpen] = useState(false);
    const [salaryForm, setSalaryForm] = useState({
        month: months[new Date().getMonth()],
        year: new Date().getFullYear(),
        amount: 0,
        notes: ''
    });

    // Edit Profile Modal state
    const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        firstname: '',
        lastname: '',
        email: '',
        phone: '',
        address: ''
    });
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState('');

    // Change Password Modal state
    const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Logout confirmation modal state
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const targetUserId = id ? Number(id) : currentUser?.Id;
    const isOwnProfile = targetUserId === currentUser?.Id;
    const isOwnerRole = currentUser?.Roles?.includes('Owner');

    useEffect(() => {
        const controller = new AbortController();
        const fetchData = async () => {
            if (!targetUserId) return;
            setLoading(true);
            try {
                const [profile, salaries, invs] = await Promise.all([
                    getUserProfile(targetUserId, { signal: controller.signal }),
                    getSalaryRecords(targetUserId, { signal: controller.signal }),
                    getAllInventories({ signal: controller.signal })
                ]);
                setProfileData(profile);
                setSalaryHistory(salaries);
                setInventories(invs);
                setSalaryForm(prev => ({ ...prev, amount: profile.CurrentSalary || 0 }));
                setError('');
            } catch (err) {
                if (axios.isCancel(err)) return;
                console.error('Failed to load user profile:', err);
                setError('Failed to load user profile.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        return () => controller.abort();
    }, [targetUserId]);

    // Format join date
    const formatJoinDate = (dateStr?: string) => {
        if (!dateStr) return 'N/A';
        const d = new Date(dateStr);
        return `${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Derived user info for display
    const userInfo: UserInfo = {
        name: profileData ? `${profileData.Firstname} ${profileData.Lastname || ''}`.trim() : 'Loading...',
        email: profileData?.Email || '',
        phone: profileData?.PhoneNumber || '',
        role: profileData?.Role || 'User',
        joinDate: formatJoinDate(profileData?.JoinDate),
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(profileData?.Firstname || 'U')}+${encodeURIComponent(profileData?.Lastname || '')}&background=17cf54&color=fff`,
        currentSalary: profileData?.CurrentSalary || 0,
        address: profileData?.Address || 'N/A',
        shopName: profileData?.ShopNo !== undefined ? (inventories.find(i => i.Id === profileData.ShopNo)?.Name || `Shop #${profileData.ShopNo}`) : 'Owner / All Shops'
    };

    const taka = '\u09F3';

const stats: StatCard[] = [
        { label: t.profile?.ordersHandled || 'Orders Handled', value: '1,234', icon: 'receipt_long' },
        { label: t.profile?.totalSales || 'Total Sales', value: `${taka} 4.5M`, icon: 'payments' },
        { label: t.profile?.thisMonth || 'This Month', value: '89', icon: 'calendar_month' },
        { label: t.profile?.lastLogin || 'Last Login', value: '2 hours ago', icon: 'schedule' },
    ];

    const toggleLanguage = () => {
        setLanguage(language === 'en' ? 'bn' : 'en');
    };

    const handlePaySalary = async () => {
        if (!targetUserId) return;
        try {
            const newRecord = await addSalaryRecord(targetUserId, {
                UserId: targetUserId,
                Month: salaryForm.month,
                Year: salaryForm.year,
                Amount: salaryForm.amount,
                Notes: salaryForm.notes || undefined
            });
            setSalaryHistory([newRecord, ...salaryHistory]);
            setPaySalaryModalOpen(false);
            setSalaryForm({
                month: months[new Date().getMonth()],
                year: new Date().getFullYear(),
                amount: profileData?.CurrentSalary || 0,
                notes: ''
            });
        } catch (err) {
            console.error('Failed to pay salary:', err);
            alert('Failed to record salary payment.');
        }
    };

    const openEditProfileModal = () => {
        if (profileData) {
            setEditForm({
                firstname: profileData.Firstname || '',
                lastname: profileData.Lastname || '',
                email: profileData.Email || '',
                phone: profileData.PhoneNumber || '',
                address: profileData.Address || ''
            });
        }
        setEditError('');
        setEditProfileModalOpen(true);
    };

    const handleSaveProfile = async () => {
        if (!targetUserId || !profileData) return;
        setEditSaving(true);
        setEditError('');
        try {
            const updated = await updateUserProfile(targetUserId, {
                Firstname: editForm.firstname,
                Lastname: editForm.lastname,
                Email: editForm.email,
                PhoneNumber: editForm.phone,
                Address: editForm.address,
                CurrentSalary: profileData.CurrentSalary
            });
            setProfileData(updated);
            setEditProfileModalOpen(false);
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            setEditError(err?.response?.data?.message || 'Failed to update profile.');
        } finally {
            setEditSaving(false);
        }
    };

    const openChangePasswordModal = () => {
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordError('');
        setPasswordSuccess('');
        setChangePasswordModalOpen(true);
    };

    const handleChangePassword = async () => {
        if (!targetUserId) return;
        setPasswordError('');
        setPasswordSuccess('');

        if (passwordForm.newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters.');
            return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordError('New passwords do not match.');
            return;
        }

        setPasswordSaving(true);
        try {
            const result = await changePassword(targetUserId, {
                CurrentPassword: passwordForm.currentPassword,
                NewPassword: passwordForm.newPassword
            });
            setPasswordSuccess(result.message || 'Password changed successfully!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => {
                setChangePasswordModalOpen(false);
                setPasswordSuccess('');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to change password:', err);
            setPasswordError(err?.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#f6f8f6] dark:bg-transparent">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[#4e9767] dark:text-gray-400 font-medium">{t.common?.loading || 'Loading profile...'}</p>
                </div>
            </div>
        );
    }

    if (error || !profileData) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#f6f8f6] dark:bg-transparent">
                <div className="text-center p-8 bg-white dark:bg-[#1a2e22] rounded-2xl shadow-sm border border-red-100 dark:border-red-900/20 max-w-sm">
                    <span className="material-symbols-outlined text-red-400 text-5xl mb-4">account_circle_off</span>
                    <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white mb-2">{error || 'User not found'}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">We couldn't retrieve the user information you're looking for.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#f6f8f6] dark:bg-transparent p-6 md:p-8">
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
                            <div className="w-28 h-28 rounded-2xl bg-center bg-cover border-4 border-[var(--color-primary)]/20 shadow-lg"
                                style={{ backgroundImage: `url("${userInfo.avatar}")` }}
                            ></div>
                            <button className="absolute -bottom-2 -right-2 w-9 h-9 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transition-all">
                                <span className="material-symbols-outlined text-white text-[18px]">camera_alt</span>
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                <h2 className="text-2xl font-bold text-[#0e1b12] dark:text-white">{userInfo.name}</h2>
                                <span className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-xs font-bold rounded-full self-center md:self-auto">
                                    {userInfo.role}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{userInfo.email}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs">
                                {t.profile?.memberSince || 'Member since'} {userInfo.joinDate}
                            </p>
                        </div>

                        {/* Edit Button */}
                        {isOwnProfile && (
                            <button
                                onClick={openEditProfileModal}
                                className="px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all bg-gray-100 dark:bg-white/10 text-[#0e1b12] dark:text-white hover:bg-gray-200 dark:hover:bg-white/15"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                                {t.profile?.editProfile || 'Edit Profile'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[var(--color-primary)]">{stat.icon}</span>
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-[#0e1b12] dark:text-white mb-1">{stat.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Current Salary Card */}
                <div className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-2xl p-6 shadow-lg shadow-primary/20">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                            <p className="text-white/80 text-sm font-medium mb-1">{t.profile?.currentSalary || 'Current Salary'}</p>
                            <p className="text-4xl font-bold text-white">{taka} {userInfo.currentSalary.toLocaleString()}</p>
                            <p className="text-white/70 text-xs mt-1">{t.profile?.perMonth || 'per month'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[32px]">account_balance_wallet</span>
                            </div>
                            {isOwnerRole && (
                                <button
                                    onClick={() => {
                                        setSalaryForm(prev => ({ ...prev, amount: userInfo.currentSalary }));
                                        setPaySalaryModalOpen(true);
                                    }}
                                    className="px-5 py-3 bg-white text-[var(--color-primary)] hover:bg-gray-100 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
                                >
                                    <span className="material-symbols-outlined text-[18px]">payments</span>
                                    {t.profile?.paySalaryNow || 'Pay Salary Now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Monthly Salary Tracker */}
                <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-[var(--color-primary)]">calendar_month</span>
                            {t.profile?.salaryHistory || 'Salary History'}
                        </h3>
                        <span className="text-xs text-gray-400">{salaryHistory.length} {t.profile?.records || 'records'}</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-white/10">
                        {salaryHistory.map((record) => (
                            <div key={record.Id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${record.Status === 'paid'
                                        ? 'bg-[var(--color-primary)]/10'
                                        : 'bg-yellow-500/10'
                                        }`}>
                                        <span className={`material-symbols-outlined ${record.Status === 'paid'
                                            ? 'text-[var(--color-primary)]'
                                            : 'text-yellow-500'
                                            }`}>
                                            {record.Status === 'paid' ? 'check_circle' : 'schedule'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#0e1b12] dark:text-white">{record.Month} {record.Year}</p>
                                        <p className="text-xs text-gray-400">
                                            {record.Status === 'paid'
                                                ? `${t.profile?.paidOn || 'Paid on'} ${record.PaidDate ? new Date(record.PaidDate).toLocaleDateString() : ''}`
                                                : t.profile?.pending || 'Pending'
                                            }
                                        </p>
                                        {record.Notes && <p className="text-xs text-gray-400 italic">{record.Notes}</p>}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-[#0e1b12] dark:text-white">{taka} {record.Amount.toLocaleString()}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${record.Status === 'paid'
                                        ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'bg-yellow-500/10 text-yellow-500'
                                        }`}>
                                        {record.Status === 'paid' ? (t.profile?.paid || 'Paid') : (t.profile?.pending || 'Pending')}
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
                            <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
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
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-gray-400">Shop / Assigned Location</label>
                                <div className="bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                                    <p className="font-medium text-[#0e1b12] dark:text-white">{userInfo.shopName}</p>
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
                {isOwnProfile && (
                    <div className="bg-white/80 dark:bg-[#1a2e22]/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                            <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[var(--color-primary)]">settings</span>
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
                                <button
                                    onClick={openChangePasswordModal}
                                    className="p-2 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
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
                                    onClick={() => setTheme(isDark ? 'light' : 'dark')}
                                    className={`relative flex items-center p-1 rounded-full w-[72px] h-[36px] cursor-pointer shrink-0 shadow-inner transition-colors duration-300 border ${isDark ? 'bg-indigo-900/40 border-indigo-700/50' : 'bg-amber-100/50 border-amber-200/50'}`}
                                    aria-label="Toggle Dark Mode"
                                >
                                    <div
                                        className={`absolute left-1 shadow-md w-[28px] h-[28px] rounded-full transition-all duration-300 flex items-center justify-center ${isDark ? 'translate-x-[36px] bg-indigo-500' : 'translate-x-0 bg-amber-400'}`}
                                    >
                                        <span className="material-symbols-outlined text-white text-[16px]">
                                            {isDark ? 'dark_mode' : 'light_mode'}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-[#f6f8f6] dark:bg-black/20 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">translate</span>
                                    <div>
                                        <p className="font-medium text-[#0e1b12] dark:text-white text-sm">{t.profile?.language || 'Language'}</p>
                                        <p className="text-xs text-gray-400">{language === 'en' ? 'English' : (t.config?.bangla || 'বাংলা')}</p>
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
                                        {t.config?.bangla || 'বাংলা'}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pay Salary Modal */}
                {paySalaryModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--color-primary)]">payments</span>
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
                                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[var(--color-primary)]">person</span>
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
                                            className="w-full bg-[#f6f8f6] dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] text-[#0e1b12] dark:text-white rounded-xl px-4 py-3 font-medium focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
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
                                            className="w-full bg-[#f6f8f6] dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] text-[#0e1b12] dark:text-white rounded-xl px-4 py-3 font-medium focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
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
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">{taka}</span>
                                        <div className="pl-8">
                                            <QuantityInput
                                                value={salaryForm.amount || 0}
                                                onChange={(val) => setSalaryForm({ ...salaryForm, amount: val as number })}
                                                min={0}
                                                step={100}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">
                                        {(t.profile as any)?.notes || 'Notes'} ({(t.common as any)?.optional || 'Optional'})
                                    </label>
                                    <textarea
                                        value={salaryForm.notes}
                                        onChange={(e) => setSalaryForm({ ...salaryForm, notes: e.target.value })}
                                        placeholder={t.profile?.notesPlaceholder || 'Add any notes...'}
                                        className="w-full bg-[#f6f8f6] dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] text-[#0e1b12] dark:text-white rounded-xl px-4 py-3 font-medium focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] resize-none"
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
                                    className="flex-1 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    {t.profile?.paySalary || 'Pay Salary'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Profile Modal */}
                {editProfileModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--color-primary)]">edit</span>
                                    {t.profile?.editProfile || 'Edit Profile'}
                                </h2>
                                <button
                                    onClick={() => setEditProfileModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-gray-500">close</span>
                                </button>
                            </div>

                            {editError && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {editError}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">{(t.common as any)?.firstname || 'First Name'}</label>
                                        <input
                                            type="text"
                                            value={editForm.firstname}
                                            onChange={(e) => setEditForm({ ...editForm, firstname: e.target.value })}
                                            className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-gray-400">{(t.common as any)?.lastname || 'Last Name'}</label>
                                        <input
                                            type="text"
                                            value={editForm.lastname}
                                            onChange={(e) => setEditForm({ ...editForm, lastname: e.target.value })}
                                            className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{t.common?.email || 'Email'}</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{t.common?.phone || 'Phone'}</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{t.profile?.address || 'Address'}</label>
                                    <textarea
                                        value={editForm.address}
                                        onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setEditProfileModalOpen(false)}
                                    disabled={editSaving}
                                    className="flex-1 py-3 text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {t.common?.cancel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleSaveProfile}
                                    disabled={editSaving}
                                    className="flex-1 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {editSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">check</span>
                                            {t.profile?.save || 'Save Changes'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Change Password Modal */}
                {changePasswordModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1a2e22] rounded-2xl w-full max-w-md shadow-2xl border border-white/10 p-6 animate-fadeIn">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[var(--color-primary)]">lock</span>
                                    {t.profile?.changePassword || 'Change Password'}
                                </h2>
                                <button
                                    onClick={() => setChangePasswordModalOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <span className="material-symbols-outlined text-gray-500">close</span>
                                </button>
                            </div>

                            {passwordError && (
                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">error</span>
                                    {passwordError}
                                </div>
                            )}

                            {passwordSuccess && (
                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                                    {passwordSuccess}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{(t.profile as any)?.currentPasswordLabel || 'Current Password'}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.currentPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{(t.profile as any)?.newPasswordLabel || 'New Password'}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.newPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase text-gray-400">{(t.profile as any)?.confirmPasswordLabel || 'Confirm New Password'}</label>
                                    <input
                                        type="password"
                                        value={passwordForm.confirmPassword}
                                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        placeholder="••••••••"
                                        className="w-full bg-[#f6f8f6] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 font-medium text-[#0e1b12] dark:text-white focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
                                    />
                                    {passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">error</span>
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setChangePasswordModalOpen(false)}
                                    disabled={passwordSaving}
                                    className="flex-1 py-3 text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    {t.common?.cancel || 'Cancel'}
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    disabled={passwordSaving || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                                    className="flex-1 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {passwordSaving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">lock</span>
                                            {t.profile?.changePassword || 'Change Password'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Logout Button */}
                {isOwnProfile && (
                    <button onClick={() => setShowLogoutConfirm(true)} className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all">
                        <span className="material-symbols-outlined">logout</span>
                        {t.profile?.logout || 'Log Out'}
                    </button>
                )}

                <LogoutConfirmModal
                    show={showLogoutConfirm}
                    onCancel={() => setShowLogoutConfirm(false)}
                    onConfirm={logout}
                />

            </div>
        </div>
    );
}
