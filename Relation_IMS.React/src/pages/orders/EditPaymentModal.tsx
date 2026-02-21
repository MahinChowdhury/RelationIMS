import { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Order } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface EditPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    onPaymentUpdated: () => void;
}

export default function EditPaymentModal({ isOpen, onClose, order, onPaymentUpdated }: EditPaymentModalProps) {
    const { t } = useLanguage();
    const [payments, setPayments] = useState<{ method: string, amount: number, note: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && order.Payments) {
            setPayments(order.Payments.map(p => ({
                method: p.PaymentMethod === 0 ? (t.orders.cash || 'Cash') : p.PaymentMethod === 1 ? (t.orders.bank || 'Bank') : (t.orders.bkash || 'Bkash'),
                amount: p.Amount,
                note: p.Note || ''
            })));
        }
    }, [isOpen, order]);

    const handleAddPayment = () => {
        setPayments([...payments, { method: t.orders.cash || 'Cash', amount: 0, note: '' }]);
    };

    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handlePaymentChange = (index: number, field: string, value: any) => {
        const newPayments = [...payments];
        (newPayments[index] as any)[field] = value;
        setPayments(newPayments);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Recalculate totals for the payload (backend will also recalc, but DTO needs valid data)
            // Ideally we re-use the exact same values from the order for non-payment fields
            // to satisfy [Required] constraints.

            const updatePayload = {
                CustomerId: order.CustomerId,
                TotalAmount: order.TotalAmount,
                Discount: order.Discount,
                NetAmount: order.NetAmount,
                // PaidAmount will be calculated by backend based on payments, 
                // but we should pass 0 or a valid number. Backend ignores it and recalcs? 
                // The repo logic: "Calculate Paid Amount from Payments... order.PaidAmount = newOrder.Payments.Sum..."
                // So whatever we send as PaidAmount might be overwritten, but let's send 0.
                PaidAmount: 0,
                PaymentStatus: order.PaymentStatus, // Will be updated by backend
                UserId: order.UserId,
                Remarks: order.Remarks,
                InternalStatus: order.InternalStatus,
                Payments: payments.map(p => ({
                    PaymentMethod: p.method === (t.orders.cash || 'Cash') ? 0 : p.method === (t.orders.bank || 'Bank') ? 1 : 2,
                    Amount: Number(p.amount),
                    Note: p.note
                }))
            };

            await api.put(`/Order/${order.Id}`, updatePayload);
            onPaymentUpdated();
            onClose();
        } catch (err) {
            console.error("Failed to update payments", err);
            alert(t.orders.failedToUpdatePayments);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const due = order.NetAmount - totalPaid;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a2e22] rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <h2 className="text-xl font-black text-text-main dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">payments</span>
                        {t.orders.editPayments || 'Edit Payments'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <span className="material-symbols-outlined text-text-secondary">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {payments.map((payment, index) => (
                            <div key={index} className="flex flex-col gap-2 p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20">
                                <div className="flex gap-2">
                                    <select
                                        value={payment.method}
                                        onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                                        className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2e22] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value={t.orders.cash || "Cash"}>{t.orders.cash || "Cash"}</option>
                                        <option value={t.orders.bank || "Bank"}>{t.orders.bank || "Bank"}</option>
                                        <option value={t.orders.bkash || "Bkash"}>{t.orders.bkash || "Bkash"}</option>
                                    </select>
                                    <input
                                        type="number"
                                        onFocus={(e) => e.target.select()}
                                        value={payment.amount}
                                        onChange={(e) => handlePaymentChange(index, 'amount', Number(e.target.value))}
                                        className="h-10 flex-1 px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2e22] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                        placeholder={t.common.amount || "Amount"}
                                    />
                                    <button
                                        onClick={() => handleRemovePayment(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    >
                                        <span className="material-symbols-outlined">delete</span>
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={payment.note}
                                    onChange={(e) => handlePaymentChange(index, 'note', e.target.value)}
                                    className="h-10 w-full px-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a2e22] text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    placeholder={t.orders.paymentNote || "Payment Note (Optional)"}
                                />
                            </div>
                        ))}

                        <button
                            onClick={handleAddPayment}
                            className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            <span className="material-symbols-outlined">add</span>
                            {t.orders.addPayment || 'Add Payment'}
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 dark:bg-black/20 rounded-xl space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t.orders.orderNetAmount || 'Order Net Amount'}:</span>
                            <span className="font-bold text-text-main dark:text-white">৳{order.NetAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">{t.orders.totalPaid || 'Total Paid'}:</span>
                            <span className="font-bold text-green-600">৳{totalPaid.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span className="font-bold text-text-main dark:text-white">{t.orders.remainingDue || 'Remaining Due'}:</span>
                            <span className={`font-black ${due > 0 ? 'text-red-500' : 'text-green-500'}`}>৳{due.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/20 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        {t.common.cancel || 'Cancel'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-green-600 transition-all shadow-lg shadow-green-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span> : <span className="material-symbols-outlined text-sm">save</span>}
                        {t.common.saveChanges || 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}
