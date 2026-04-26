import { createPortal } from 'react-dom';
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

type NewPayment = { method: string; amount: number; note: string };

export default function EditPaymentModal({ isOpen, onClose, order, onPaymentUpdated }: EditPaymentModalProps) {
    const { t } = useLanguage();
    const taka = '\u09F3';
    const [newPayments, setNewPayments] = useState<NewPayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const methodLabel = (m: number) =>
        m === 0 ? (t.orders.cash || 'Cash') : m === 1 ? (t.orders.bank || 'Bank') : (t.orders.bkash || 'Bkash');

    useEffect(() => {
        if (isOpen) {
            setNewPayments([]);
            setError('');
        }
    }, [isOpen, order]);

    const handleAddRow = () => {
        setNewPayments(prev => [...prev, { method: t.orders.cash || 'Cash', amount: 0, note: '' }]);
    };

    const handleRemove = (index: number) => {
        setNewPayments(prev => prev.filter((_, i) => i !== index));
    };

    const handleChange = (index: number, field: keyof NewPayment, value: any) => {
        setNewPayments(prev => {
            const copy = [...prev];
            (copy[index] as any)[field] = value;
            return copy;
        });
    };

    const oldPaid = order.Payments?.reduce((s, p) => s + p.Amount, 0) ?? 0;
    const newTotal = newPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
    const totalAfter = oldPaid + newTotal;
    const remaining = order.NetAmount - totalAfter;

    const handleSave = async () => {
        setError('');
        if (newTotal <= 0) {
            setError('Please enter a payment amount greater than 0.');
            return;
        }
        if (totalAfter > order.NetAmount) {
            setError(`Payment total (${taka}${totalAfter.toFixed(2)}) cannot exceed the order net amount (${taka}${order.NetAmount.toFixed(2)}).`);
            return;
        }

        setLoading(true);
        try {
            const updatePayload = {
                CustomerId: order.CustomerId,
                TotalAmount: order.TotalAmount,
                Discount: order.Discount,
                NetAmount: order.NetAmount,
                PaidAmount: 0,
                PaymentStatus: order.PaymentStatus,
                UserId: order.UserId,
                Remarks: order.Remarks,
                InternalStatus: order.InternalStatus,
                Payments: newPayments.map(p => ({
                    PaymentMethod: p.method === (t.orders.cash || 'Cash') ? 0 : p.method === (t.orders.bank || 'Bank') ? 1 : 2,
                    Amount: Number(p.amount),
                    Note: p.note
                }))
            };

            await api.put(`/Order/${order.Id}`, updatePayload);
            onPaymentUpdated();
            onClose();
        } catch (err: any) {
            console.error('Failed to update payments', err);
            setError(err.response?.data?.message || 'Failed to update payment. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const paymentStatusLabel = (s: number) =>
        s === 2 ? 'Paid' : s === 1 ? 'Partial' : 'Pending';

    const paymentStatusColor = (s: number) =>
        s === 2
            ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
            : s === 1
            ? 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20'
            : 'text-gray-500 bg-gray-100 dark:bg-gray-700/30';

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[92vh] overflow-hidden">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-black text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[22px]">payments</span>
                            Collect Due Payment
                        </h2>
                        <p className="text-sm text-text-secondary mt-0.5">Order #{order.Id}</p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <span className="material-symbols-outlined text-text-secondary">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex flex-col gap-5">

                    {/* Order Summary Card */}
                    <div className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-black/20 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-text-secondary">receipt_long</span>
                            <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">Order Summary</span>
                        </div>
                        <div className="px-4 py-3 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Net Amount</span>
                                <span className="text-sm font-bold text-text-main dark:text-white">{taka}{order.NetAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Already Paid</span>
                                <span className="text-sm font-bold text-green-600 dark:text-green-400">{taka}{oldPaid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm font-bold text-text-main dark:text-white">Current Due</span>
                                <span className={`text-sm font-black ${(order.NetAmount - oldPaid) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {taka}{(order.NetAmount - oldPaid).toFixed(2)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-text-secondary">Status</span>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${paymentStatusColor(order.PaymentStatus)}`}>
                                    {paymentStatusLabel(order.PaymentStatus)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Previous Payments */}
                    {order.Payments && order.Payments.length > 0 && (
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-2 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">history</span>
                                Payment History
                            </p>
                            <div className="space-y-1.5">
                                {order.Payments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center px-3 py-2 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                                            <span className="text-sm text-text-secondary">{methodLabel(p.PaymentMethod)}</span>
                                            {p.Note && <span className="text-xs text-gray-400 italic">· {p.Note}</span>}
                                        </div>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">{taka}{p.Amount.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* New Payments */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">add_card</span>
                                New Payment
                            </p>
                            {/* "Add Another" only appears when the last row is filled */}
                            {newPayments.length > 0 && Number(newPayments[newPayments.length - 1].amount) > 0 && (
                                <button
                                    onClick={handleAddRow}
                                    className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                                >
                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                    Add Another
                                </button>
                            )}
                        </div>

                        {newPayments.length === 0 ? (
                            <button
                                onClick={handleAddRow}
                                className="w-full py-3 border-2 border-dashed border-primary/40 rounded-xl text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 font-bold text-sm"
                            >
                                <span className="material-symbols-outlined text-[18px]">add</span>
                                Add Payment
                            </button>
                        ) : (
                            <div className="space-y-3">
                                {newPayments.map((p, i) => (
                                    <div key={i} className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <select
                                                value={p.method}
                                                onChange={e => handleChange(i, 'method', e.target.value)}
                                                className="h-10 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[var(--color-surface-dark-card)] text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                <option value={t.orders.cash || 'Cash'}>{t.orders.cash || 'Cash'}</option>
                                                <option value={t.orders.bank || 'Bank'}>{t.orders.bank || 'Bank'}</option>
                                                <option value={t.orders.bkash || 'Bkash'}>{t.orders.bkash || 'Bkash'}</option>
                                            </select>
                                            <input
                                                type="number"
                                                min={0}
                                                value={p.amount || ''}
                                                onChange={e => handleChange(i, 'amount', Number(e.target.value))}
                                                onFocus={e => e.target.select()}
                                                className="h-10 flex-1 px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[var(--color-surface-dark-card)] text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Amount"
                                            />
                                            <button
                                                onClick={() => handleRemove(i)}
                                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={p.note}
                                            onChange={e => handleChange(i, 'note', e.target.value)}
                                            className="h-9 w-full px-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-[var(--color-surface-dark-card)] text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                            placeholder="Note (optional)"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Live Due Preview */}
                    {newTotal > 0 && (
                        <div className="rounded-xl bg-primary/5 border border-primary/20 px-4 py-3 space-y-1.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-text-secondary">Adding</span>
                                <span className="font-bold text-primary">+{taka}{newTotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1.5 border-t border-primary/10">
                                <span className="font-bold text-text-main dark:text-white">Remaining Due After</span>
                                <span className={`font-black ${remaining > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                    {taka}{Math.max(0, remaining).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                            <span className="material-symbols-outlined text-[18px] mt-0.5">error</span>
                            {error}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-black/10 flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || newPayments.length === 0 || newTotal <= 0}
                        className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-lg shadow-primary/20 disabled:opacity-40 flex items-center gap-2"
                    >
                        {loading
                            ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                            : <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        }
                        {loading ? 'Saving...' : `Collect ${newTotal > 0 ? taka + newTotal.toFixed(2) : 'Payment'}`}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}
