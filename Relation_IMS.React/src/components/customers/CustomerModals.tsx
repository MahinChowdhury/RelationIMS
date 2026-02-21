import type { Customer } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

// --- Types ---
interface CustomerFormModalProps {
    show: boolean;
    mode: 'create' | 'edit';
    customer: Customer;
    onClose: () => void;
    onSave: () => void;
    onChange: (field: string, value: any) => void;
}

interface DeleteCustomerModalProps {
    show: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

// --- CREATE / EDIT MODAL ---
export function CustomerFormModal({
    show,
    mode,
    customer,
    onClose,
    onSave,
    onChange
}: CustomerFormModalProps) {
    const { t } = useLanguage();
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 dark:border-[#2a4032] animate-fadeIn">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2a4032] flex items-center justify-between bg-gray-50/50 dark:bg-[#112116]/50">
                    <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl flex items-center justify-center shadow-sm ${mode === 'create' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                            <span className="material-symbols-outlined text-[24px]">
                                {mode === 'create' ? 'person_add' : 'edit_square'}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-text-main dark:text-white leading-tight">
                                {mode === 'create' ? t.customers.addCustomer : t.customers.editCustomer}
                            </h2>
                            <p className="text-xs text-text-secondary dark:text-gray-400 font-medium">
                                {mode === 'create' ? t.dialog.enterDetails || 'Enter details' : t.customers.editCustomer}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 flex flex-col gap-4">
                    {/* Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.common.name}</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">person</span>
                            </div>
                            <input
                                type="text"
                                value={customer.Name}
                                onChange={(e) => onChange('Name', e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors"
                                placeholder="e.g. Michael Ross"
                                required
                            />
                        </div>
                    </div>

                    {/* Contact Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.common.phone}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                    <span className="material-symbols-outlined text-[20px]">call</span>
                                </div>
                                <input
                                    type="tel"
                                    value={customer.Phone}
                                    onChange={(e) => onChange('Phone', e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors"
                                    placeholder="0177......."
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.common.address}</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                            </div>
                            <textarea
                                value={customer.Address}
                                onChange={(e) => onChange('Address', e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors resize-none"
                                placeholder="Enter customer address"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.customers.shopName}</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                            </div>
                            <textarea
                                value={customer.ShopName}
                                onChange={(e) => onChange('ShopName', e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors resize-none"
                                placeholder="Enter Shop name"
                            ></textarea>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-bold text-text-main dark:text-gray-300">{t.customers.shopAddress}</label>
                        <div className="relative">
                            <div className="absolute top-3 left-3 pointer-events-none text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                            </div>
                            <textarea
                                value={customer.ShopAddress}
                                onChange={(e) => onChange('ShopAddress', e.target.value)}
                                rows={3}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-primary focus:border-primary block dark:bg-[#112116] dark:border-gray-700 dark:placeholder-gray-400 dark:text-white transition-colors resize-none"
                                placeholder="Enter shop address"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50/50 dark:bg-[#112116]/50 border-t border-gray-100 dark:border-[#2a4032] flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#1a2e22] dark:border-[#2a4032] dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-green-500 shadow-md shadow-green-500/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                        {mode === 'create' ? t.customers.addCustomer : t.common.saveChanges}
                    </button>
                </div>
            </div>
        </div>
    );
}

// --- DELETE MODAL ---
export function DeleteCustomerModal({ show, onCancel, onConfirm }: DeleteCustomerModalProps) {
    const { t } = useLanguage();
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all">
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-[#2a4032] animate-fadeIn">
                <div className="p-6 flex flex-col items-center text-center gap-4">
                    <div className="size-14 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-[32px]">warning</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-text-main dark:text-white mb-1">{t.customers.deleteCustomer}</h2>
                        <p className="text-sm text-text-secondary dark:text-gray-400">
                            {t.common.areYouSure}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 px-6 pb-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-bold text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#1a2e22] dark:border-[#2a4032] dark:text-gray-200 dark:hover:bg-white/5 transition-colors"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 shadow-md shadow-red-500/20 transition-all"
                    >
                        {t.common.yes}, {t.common.delete}
                    </button>
                </div>
            </div>
        </div>
    );
}
