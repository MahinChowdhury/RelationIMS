import { useState, useEffect } from 'react';
import type { CreateManualEntryDTO } from '../../services/cashBookService';

interface NewCashBookEntryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateManualEntryDTO) => Promise<void>;
    initialData?: {
        TransactionType: string;
        Description: string;
        Amount: string;
        Type: 'CashIn' | 'CashOut';
        Note: string;
    } | null;
}

const NewCashBookEntryModal = ({ isOpen, onClose, onSubmit, initialData }: NewCashBookEntryModalProps) => {
    const [transactionType, setTransactionType] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'CashIn' | 'CashOut'>('CashOut');
    const [note, setNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setTransactionType(initialData.TransactionType);
                setDescription(initialData.Description);
                setAmount(initialData.Amount);
                setType(initialData.Type);
                setNote(initialData.Note);
            } else {
                setTransactionType('');
                setDescription('');
                setAmount('');
                setType('CashOut');
                setNote('');
            }
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert('Please enter a valid amount.');
            return;
        }

        const data: CreateManualEntryDTO = {
            TransactionType: transactionType,
            Description: description,
            CashIn: type === 'CashIn' ? numAmount : null,
            CashOut: type === 'CashOut' ? numAmount : null,
            Note: note,
        };

        setIsSubmitting(true);
        try {
            await onSubmit(data);
            
            onClose();
        } catch (error) {
            console.error('Error creating entry:', error);
            alert('Failed to create entry. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-[var(--color-surface-dark-border)] animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 dark:border-[var(--color-surface-dark-border)] flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-text-main dark:text-white">New Cashbook Entry</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Record a manual transaction</p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-gray-500 dark:text-gray-400">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Entry Type Toggle */}
                    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-black/20 rounded-xl">
                        <button
                            type="button"
                            onClick={() => setType('CashIn')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                type === 'CashIn' 
                                    ? 'bg-emerald-500 text-white shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Cash In
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('CashOut')}
                            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                                type === 'CashOut' 
                                    ? 'bg-red-500 text-white shadow-md' 
                                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                        >
                            Cash Out
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Transaction Type <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={transactionType}
                                onChange={(e) => setTransactionType(e.target.value)}
                                placeholder="e.g., Office Supplies, Tea/Coffee"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
                            />
                        </div>

                        <div className="col-span-2 sm:col-span-1 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Amount (৳) <span className="text-red-500">*</span></label>
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

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Description <span className="text-red-500">*</span></label>
                            <input 
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Short description of the transaction"
                                required
                                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/20 text-sm font-medium text-text-main dark:text-white"
                            />
                        </div>

                        <div className="col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Additional Note (Optional)</label>
                            <textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Any additional details..."
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
                            className={`flex-1 py-3 text-white font-bold rounded-xl shadow-lg hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2 ${
                                type === 'CashIn' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-red-500 shadow-red-500/20'
                            }`}
                        >
                            {isSubmitting ? (
                                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-sm">add_task</span>
                                    Record {type === 'CashIn' ? 'Cash In' : 'Cash Out'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCashBookEntryModal;
