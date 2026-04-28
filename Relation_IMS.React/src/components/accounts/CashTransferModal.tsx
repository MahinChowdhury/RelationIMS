import { useState, useEffect } from 'react';
import { getCurrentBalance } from '../../services/cashBookService';
import type { CreateCashTransferDTO } from '../../services/cashBookService';
import type { Inventory } from '../../types';

interface CashTransferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateCashTransferDTO, toShopNo?: number) => Promise<void>;
    shopNo: number;
    // Owner transferring FROM shop0 to another shop
    isOwnerOnHQ?: boolean;
    inventories?: Inventory[];
}

const CashTransferModal = ({ isOpen, onClose, onSubmit, shopNo, isOwnerOnHQ = false, inventories = [] }: CashTransferModalProps) => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentBalance, setCurrentBalance] = useState<number | null>(null);
    // Destination shop (only relevant when isOwnerOnHQ = true)
    const [toShopNo, setToShopNo] = useState<number | undefined>(undefined);

    useEffect(() => {
        if (isOpen && shopNo >= 0) {
            fetchBalance();
        }
        // Reset destination when modal opens
        if (isOpen) {
            setToShopNo(inventories.length > 0 ? inventories[0].Id : undefined);
        }
    }, [isOpen, shopNo]);

    const fetchBalance = async () => {
        try {
            const data = await getCurrentBalance(shopNo);
            setCurrentBalance(data.balance);
        } catch (error) {
            console.error('Failed to fetch balance:', error);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        if (isOwnerOnHQ && !toShopNo) {
            alert('Please select a destination shop.');
            return;
        }

        if (currentBalance !== null && numAmount > currentBalance) {
            if (!window.confirm('The transfer amount is greater than your current balance. Are you sure you want to proceed?')) {
                return;
            }
        }

        const data: CreateCashTransferDTO = {
            Amount: numAmount,
            Note: note,
        };

        setIsSubmitting(true);
        try {
            await onSubmit(data, isOwnerOnHQ ? toShopNo : undefined);

            // Reset form
            setAmount('');
            setNote('');
            onClose();
        } catch (error) {
            console.error('Error transferring funds:', error);
            alert('Failed to transfer funds. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amt: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2,
        }).format(amt).replace('BDT', '৳');
    };

    const title = isOwnerOnHQ ? 'Transfer to Shop' : 'Transfer to HQ';
    const subtitle = isOwnerOnHQ
        ? 'Send funds from the Mother Cashbook to a shop'
        : 'Send funds to the Mother Cashbook';

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-[var(--color-surface-dark-border)] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-main dark:text-white">{title}</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {currentBalance !== null && (
                        <div className="p-4 bg-primary/10 rounded-xl flex items-center justify-between border border-primary/20">
                            <span className="text-sm font-bold text-primary">Current Balance:</span>
                            <span className="text-lg font-extrabold text-primary">{formatCurrency(currentBalance)}</span>
                        </div>
                    )}

                    {/* Destination shop selector (owner on HQ only) */}
                    {isOwnerOnHQ && inventories.length > 0 && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] text-primary">store</span>
                                Destination Shop <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={toShopNo !== undefined ? String(toShopNo) : ''}
                                onChange={e => setToShopNo(e.target.value ? Number(e.target.value) : undefined)}
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white cursor-pointer"
                            >
                                <option value="" className="dark:bg-gray-800">Select a shop…</option>
                                {inventories.map(inv => (
                                    <option key={inv.Id} value={String(inv.Id)} className="dark:bg-gray-800">
                                        {inv.Name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Transfer Amount (৳) <span className="text-red-500">*</span></label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Note (Optional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="E.g., End of day transfer for 25th Oct"
                                rows={2}
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">send_money</span>
                                    Transfer
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashTransferModal;
