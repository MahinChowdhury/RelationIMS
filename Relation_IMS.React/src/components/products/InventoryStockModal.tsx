import { createPortal } from 'react-dom';
import type { InventoryStock } from '../../types';
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

interface InventoryStockModalProps {
    show: boolean;
    onClose: () => void;
    stockData: InventoryStock[];
    loading: boolean;
    variantName?: string;
    mode: 'available' | 'defect';
}

export default function InventoryStockModal({ show, onClose, stockData, loading, variantName, mode }: InventoryStockModalProps) {
    const { t } = useLanguage();
    const [expandedInventoryId, setExpandedInventoryId] = useState<number | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    if (!show) return null;

    const handleCopy = async (code: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code);
            } else {
                throw new Error("Clipboard API not available");
            }
        } catch (err) {
            // Fallback for mobile browsers or unsecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = code;
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            try {
                document.execCommand('copy');
            } catch (e) {
                console.error("Fallback copy failed", e);
            }
            document.body.removeChild(textArea);
        }
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const toggleExpand = (inventoryId: number) => {
        setExpandedInventoryId(prev => (prev === inventoryId ? null : inventoryId));
    };

    const getCodes = (item: InventoryStock) => {
        return mode === 'available' ? item.AvailableItemCodes : item.DefectItemCodes;
    };

    const getCount = (item: InventoryStock) => {
        return mode === 'available' ? item.Quantity : item.DefectQuantity;
    };

    const title = mode === 'available' ? t.products.stockAndVariants : t.products.defects;
    const emptyMessage = mode === 'available' ? t.common.noData : t.common.noData;
    const totalLabel = mode === 'available' ? t.products.inStock : t.products.defects;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 pt-4 md:pt-0 animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1e1e1e] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-[#333] transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] md:max-h-[85dvh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 dark:border-[#333] flex justify-between items-center bg-white dark:bg-[#1e1e1e] shrink-0">
                    <div>
                        <h3 className="text-gray-900 dark:text-white text-base font-bold">{title}</h3>
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
                <div className="flex-1 overflow-y-auto overscroll-contain">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3">
                            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-800 dark:border-gray-700 dark:border-t-white rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-xs font-medium">{t.products.checkingAvailability}</p>
                        </div>
                    ) : stockData.length === 0 ? (
                        <div className="text-center py-8 px-4">
                            <div className="bg-gray-50 dark:bg-white/5 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="material-symbols-outlined text-gray-400">inventory_2</span>
                            </div>
                            <p className="text-gray-500 text-sm">{emptyMessage}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 dark:divide-[#333]">
                            {stockData.map((item) => {
                                const count = getCount(item);
                                const codes = getCodes(item);
                                const isExpanded = expandedInventoryId === item.InventoryId;

                                return (
                                    <div key={item.InventoryId} className="flex flex-col">
                                        <div
                                            className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                                            onClick={() => toggleExpand(item.InventoryId)}
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

                                            <div className="flex items-center gap-2">
                                                <div className={`px-2.5 py-1 rounded-md text-xs font-bold border ${count > 0
                                                    ? 'bg-white text-gray-900 border-gray-200 dark:bg-white/5 dark:text-white dark:border-white/10'
                                                    : 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900/30'
                                                    }`}>
                                                    {count > 0 ? `${count} units` : 'None'}
                                                </div>
                                                {codes && codes.length > 0 && (
                                                    <span className={`material-symbols-outlined text-gray-400 text-[20px] transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                                        expand_more
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expandable Code List */}
                                        {isExpanded && codes && codes.length > 0 && (
                                            <div className="bg-gray-50 dark:bg-black/20 px-5 py-2 border-t border-gray-100 dark:border-[#333] animate-in slide-in-from-top-2 duration-200">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wide">{t.products.productCodes}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {codes.map((code, idx) => (
                                                        <button
                                                            key={idx}
                                                            onClick={() => handleCopy(code)}
                                                            title="Click to copy"
                                                            className="group/code relative flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] rounded text-xs font-mono text-gray-600 dark:text-gray-300 hover:border-primary/50 hover:bg-primary/5 transition-all"
                                                        >
                                                            {code}
                                                            <span className="material-symbols-outlined text-[14px] text-gray-400 group-hover/code:text-primary transition-colors">
                                                                {copiedCode === code ? 'done' : 'content_copy'}
                                                            </span>
                                                            {copiedCode === code && (
                                                                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded shadow-lg animate-in fade-in zoom-in duration-200 pointer-events-none">
                                                                    {t.common.okay}
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {stockData.length > 0 && !loading && (
                    <div className="px-5 py-3 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-[#333] flex justify-between items-center text-xs shrink-0">
                        <span className="text-gray-500">{totalLabel}</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                            {stockData.reduce((acc, item) => acc + getCount(item), 0)} units
                        </span>
                    </div>
                )}
            </div>
        </div>
    , document.body);
}
