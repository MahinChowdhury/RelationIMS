import type { InventoryStock } from '../../types';

interface InventoryStockModalProps {
    show: boolean;
    onClose: () => void;
    stockData: InventoryStock[];
    loading: boolean;
    variantName?: string;
}

export default function InventoryStockModal({ show, onClose, stockData, loading, variantName }: InventoryStockModalProps) {
    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-[#333] transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#333] flex justify-between items-center bg-white dark:bg-[#1e1e1e]">
                    <div>
                        <h3 className="text-gray-900 dark:text-white text-base font-bold">Stock Distribution</h3>
                        {variantName && <p className="text-gray-500 text-xs mt-0.5">{variantName}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-white rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-xs font-medium">Checking availability...</p>
                        </div>
                    ) : stockData.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <div className="bg-gray-50 dark:bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                            </div>
                            <p className="text-gray-500 text-sm">No inventory records found.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-[#333]">
                            {stockData.map((item) => (
                                <div
                                    key={item.InventoryId}
                                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        {/* Neutral Icon */}
                                        <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/10 transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">store</span>
                                        </div>
                                        <div>
                                            <p className="text-gray-900 dark:text-gray-100 font-bold text-sm">
                                                {item.Inventory?.Name || `Inventory #${item.InventoryId}`}
                                            </p>
                                            {item.Inventory?.Description && (
                                                <p className="text-gray-500 text-[11px] max-w-[150px] truncate">
                                                    {item.Inventory.Description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* High Contrast Badge */}
                                    <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${item.Quantity > 0
                                            ? 'bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:border-white/10'
                                            : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                        }`}>
                                        {item.Quantity > 0 ? `${item.Quantity} in stock` : 'Out of stock'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {stockData.length > 0 && !loading && (
                    <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-[#333] flex justify-between items-center text-xs">
                        <span className="text-gray-500">Total Available</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {stockData.reduce((acc, item) => acc + item.Quantity, 0)} units
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
