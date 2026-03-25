import { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { createUser, getAllRoles, type RoleDTO } from '../../services/userService';
import { QuantityInput } from '../../components/QuantityInput';

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: () => void;
}

export default function AddUserModal({ isOpen, onClose, onAdd }: AddUserModalProps) {
    const { t } = useLanguage();
    const taka = '\u09F3';
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [roles, setRoles] = useState<RoleDTO[]>([]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'Salesman',
        address: '',
        currentSalary: 0,
    });

    useEffect(() => {
        if (isOpen) {
            getAllRoles().then(r => {
                setRoles(r);
                if (r.length > 0) setFormData(prev => ({ ...prev, role: r[0].Name }));
            }).catch(() => { });
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t.auth.passwordsDontMatch);
            return;
        }

        setLoading(true);
        try {
            await createUser({
                Firstname: formData.firstName,
                Lastname: formData.lastName || undefined,
                Email: formData.email || undefined,
                PhoneNumber: formData.phoneNumber,
                Password: formData.password,
                Role: formData.role,
                Address: formData.address || undefined,
                CurrentSalary: formData.currentSalary,
            });
            onAdd();
            onClose();
            setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '', password: '', confirmPassword: '', role: roles[0]?.Name || 'Salesman', address: '', currentSalary: 0 });
        } catch (err: any) {
            setError(err?.response?.data?.message || 'Failed to create user.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 pt-4 md:pt-0">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-md bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-2xl border border-gray-100 dark:border-[var(--color-surface-dark-border)] overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] bg-gray-50/50 dark:bg-black/10">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                        </div>
                        <h2 className="text-lg font-bold text-text-main dark:text-white">Add New User</h2>
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
                    <form id="add-user-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">First Name</label>
                                <input type="text" name="firstName" required value={formData.firstName} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Jane" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Last Name</label>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="Doe" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="jane@example.com" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Phone Number</label>
                            <input type="tel" name="phoneNumber" required value={formData.phoneNumber} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="01XXXXXXXXX" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Role</label>
                            <select name="role" value={formData.role} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none">
                                {roles.map(role => (
                                    <option key={role.Id} value={role.Name}>{role.Name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Password</label>
                                <input type="password" name="password" required value={formData.password} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="••••••••" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Confirm Password</label>
                                <input type="password" name="confirmPassword" required value={formData.confirmPassword} onChange={handleChange}
                                    className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="••••••••" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Address</label>
                            <input type="text" name="address" value={formData.address} onChange={handleChange}
                                className="w-full px-3 py-2 text-sm text-text-main dark:text-white bg-white dark:bg-[#132219] border border-gray-200 dark:border-[var(--color-surface-dark-border)] rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none" placeholder="123 Main Street, Dhaka" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary uppercase mb-1">Current Salary ({taka})</label>
                            <QuantityInput
                                value={formData.currentSalary || 0}
                                onChange={(val) => setFormData(prev => ({ ...prev, currentSalary: val }))}
                                min={0}
                                step={100}
                            />
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-[var(--color-surface-dark-border)] bg-gray-50/50 dark:bg-black/10 flex items-center justify-end gap-3 shrink-0">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 dark:bg-white/5 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors">{t.common.cancel}</button>
                    <button type="submit" form="add-user-form" disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-primary/20">
                        {loading ? (<><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Creating...</>) : (<><span className="material-symbols-outlined text-[18px]">check</span> Create User</>)}
                    </button>
                </div>
            </div>
        </div>
    );
}
