import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { updateUser, getAllRoles, getUserProfile, type UserDTO, type RoleDTO } from '../../services/userService';
import { QuantityInput } from '../../components/QuantityInput';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
    user: UserDTO;
}

export default function EditUserModal({ isOpen, onClose, onUpdated, user }: EditUserModalProps) {
    const { t } = useLanguage();
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [roles, setRoles] = useState<RoleDTO[]>([]);
    const [currentSalary, setCurrentSalary] = useState<string>('');

    const isOwner = currentUser?.Roles.includes('Owner');

    const [formData, setFormData] = useState({
        firstName: user.Firstname,
        lastName: user.Lastname || '',
        phoneNumber: user.PhoneNumber,
        isActive: user.IsActive,
        role: user.Role,
    });

    useEffect(() => {
        if (isOpen) {
            getAllRoles().then(setRoles).catch(() => { });
            setFormData({
                firstName: user.Firstname,
                lastName: user.Lastname || '',
                phoneNumber: user.PhoneNumber,
                isActive: user.IsActive,
                role: user.Role,
            });
            // Fetch current salary from user profile
            getUserProfile(user.Id).then(profile => {
                setCurrentSalary(profile.CurrentSalary?.toString() || '');
            }).catch(() => {
                setCurrentSalary('');
            });
        }
    }, [isOpen, user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const salaryValue = currentSalary ? parseFloat(currentSalary) : undefined;
            await updateUser(user.Id, {
                Firstname: formData.firstName,
                Lastname: formData.lastName || undefined,
                PhoneNumber: formData.phoneNumber,
                IsActive: formData.isActive,
                Role: formData.role,
                CurrentSalary: salaryValue,
            });
            onUpdated();
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to update user.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 pt-4 md:pt-0">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2a4032] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#2a4032] bg-gray-50/50 dark:bg-black/10">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                        </div>
                        <h2 className="text-lg font-bold text-text-main dark:text-white">Edit User</h2>
                    </div>
                    <button onClick={onClose} className="size-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">{error}</div>
                    )}
                    <form id="edit-user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">First Name</label>
                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm bg-white dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Phone Number</label>
                            <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" />
                        </div>

                        {/* Active toggle */}
                        <div className="flex items-center gap-3">
                            <label className="block text-xs font-bold text-text-secondary uppercase">Active</label>
                            <button type="button" onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isActive ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <span className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${formData.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-xs text-text-secondary">{formData.isActive ? 'Active' : 'Inactive'}</span>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#132219] border border-gray-200 dark:border-[#2a4032] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none">
                                {roles.map(role => (
                                    <option key={role.Id} value={role.Name}>{role.Name}</option>
                                ))}
                            </select>
                        </div>

                        {isOwner && (
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Current Salary</label>
                                <QuantityInput
                                    value={parseInt(currentSalary) || 0}
                                    onChange={(val) => setCurrentSalary(val.toString())}
                                    min={0}
                                    step={100}
                                />
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[#2a4032] bg-gray-50/50 dark:bg-black/10 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 dark:bg-white/5 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{t.common.cancel}</button>
                    <button type="submit" form="edit-user-form" disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-green-500/20">
                        {loading ? (<><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Saving...</>) : (<><span className="material-symbols-outlined text-[18px]">check</span> Save Changes</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
