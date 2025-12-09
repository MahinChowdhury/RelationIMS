import type { Customer } from '../../types';

// --- Types ---
interface CustomerFormModalProps {
    show: boolean;
    mode: 'create' | 'edit';
    customer: Customer; // In create mode, this will be empty/partial
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
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-[95%] max-w-md border-2 border-[#d0e7d7] relative my-8 animate-fadeIn overflow-y-auto max-h-[90vh]">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-2xl font-bold"
                >
                    ×
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mode === 'create' ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            )}
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] text-2xl font-black">{mode === 'create' ? 'Add New Customer' : 'Edit Customer'}</h2>
                        <p className="text-[#4e9767] text-sm font-medium">{mode === 'create' ? 'Create a new customer profile' : 'Update customer information'}</p>
                    </div>
                </div>

                <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); onSave(); }}>
                    {/* Name */}
                    <div>
                        <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Full Name</label>
                        <input
                            value={customer.Name}
                            onChange={(e) => onChange('Name', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            placeholder="Enter full name"
                            required
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Phone Number</label>
                        <input
                            value={customer.Phone}
                            onChange={(e) => onChange('Phone', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            placeholder="Enter phone number"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Email Address</label>
                        <input
                            type="email"
                            value={customer.Email}
                            onChange={(e) => onChange('Email', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            placeholder="Enter email address"
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Address</label>
                        <textarea
                            value={customer.Address}
                            onChange={(e) => onChange('Address', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all resize-none"
                            placeholder="Enter delivery address"
                        ></textarea>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#e7f3eb] mt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[#0e1b12] bg-[#e7f3eb] hover:bg-[#d0e7d7] font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            {mode === 'create' ? 'Add Customer' : 'Update Customer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// --- DELETE MODAL ---
export function DeleteCustomerModal({ show, onCancel, onConfirm }: DeleteCustomerModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90%] max-w-md border-2 border-[#d0e7d7] transform transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] text-xl font-black">Delete Customer</h2>
                        <p className="text-[#4e9767] text-sm">This action cannot be undone</p>
                    </div>
                </div>
                <p className="text-[#0e1b12] text-base mb-6 leading-relaxed">
                    Are you sure you want to delete this customer? All associated data will be permanently removed.
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl text-[#0e1b12] bg-[#e7f3eb] hover:bg-[#d0e7d7] font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-md hover:shadow-lg"
                    >
                        Delete Customer
                    </button>
                </div>
            </div>
        </div>
    );
}
