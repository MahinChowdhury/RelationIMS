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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] px-6 py-4 flex justify-between items-center">
                    <div>
                        <h3 className="text-white text-lg font-bold">Stock Distribution</h3>
                        {variantName && <p className="text-green-50 text-xs mt-1">{variantName}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="max-h-[60vh] overflow-y-auto p-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-8 h-8 border-3 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin"></div>
                            <p className="text-[#4e9767] text-sm font-medium">Loading inventory...</p>
                        </div>
                    ) : stockData.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No inventory records found.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {stockData.map((item) => (
                                <div
                                    key={item.InventoryId}
                                    className="flex items-center justify-between p-3 bg-[#f8fcf9] border border-[#e7f3eb] rounded-xl hover:border-[#4e9767] transition-colors"
                                >
                                    <div>
                                        <p className="text-[#0e1b12] font-bold text-sm">{item.Inventory?.Name || `Inventory #${item.InventoryId}`}</p>
                                        {item.Inventory?.Description && (
                                            <p className="text-[#4e9767] text-xs mt-0.5">{item.Inventory.Description}</p>
                                        )}
                                    </div>
                                    <span className={`px-3 py-1 rounded-lg text-sm font-bold ${item.Quantity > 0 ? 'bg-[#e7f3eb] text-[#4e9767]' : 'bg-red-50 text-red-600'}`}>
                                        {item.Quantity}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
