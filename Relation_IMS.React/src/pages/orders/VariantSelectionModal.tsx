import { createPortal } from 'react-dom';
import { useState, useEffect, useMemo } from 'react';
import { type Product, type ProductVariant } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    variants: ProductVariant[];
    onConfirm: (items: any[]) => void;
}

export default function VariantSelectionModal({ isOpen, onClose, product, variants, onConfirm }: VariantSelectionModalProps) {
    const { t } = useLanguage();
    const taka = '\u09F3';
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeIds, setSelectedSizeIds] = useState<number[]>([]);
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);

    // Staging List State
    interface StagedItem {
        tempId: number; // For UI key
        variant: ProductVariant;
        quantity: number;
        price: number;
        subtotal: number;
    }
    const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);

    // Reset state when product changes
    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1);
            setPrice(product.BasePrice);
            setSelectedColorId(null);
            setSelectedSizeIds([]);
            setStagedItems([]); // Clear staging on new open
        }
    }, [isOpen, product]);

    // Extract unique colors and sizes
    const uniqueColors = useMemo(() => {
        const colors = new Map();
        variants.forEach(v => {
            if (v.Color) colors.set(v.ProductColorId, v.Color);
        });
        return Array.from(colors.values());
    }, [variants]);

    const uniqueSizes = useMemo(() => {
        const sizes = new Map();
        variants.forEach(v => {
            if (v.Size) sizes.set(v.ProductSizeId, v.Size);
        });
        return Array.from(sizes.values());
    }, [variants]);

    // Find valid variants for the current selection
    // We only update price based on the FIRST selected valid variant to give a hint, 
    // or keep it manual.
    useEffect(() => {
        // If we select a color and 1 size, try to find that variant price
        if (selectedColorId && selectedSizeIds.length === 1) {
            const v = variants.find(v => v.ProductColorId === selectedColorId && v.ProductSizeId === selectedSizeIds[0]);
            if (v) {
                setPrice(v.VariantPrice || product?.BasePrice || 0);
            }
        }
    }, [selectedColorId, selectedSizeIds, product, variants]);


    if (!isOpen || !product) return null;

    const handleStageItems = () => {
        if (!selectedColorId || selectedSizeIds.length === 0 || quantity <= 0) return;

        // Validation Logic
        const invalidSelections: string[] = [];
        const newItems: StagedItem[] = [];

        selectedSizeIds.forEach(sizeId => {
            const variant = variants.find(v => v.ProductColorId === selectedColorId && v.ProductSizeId === sizeId);
            if (variant) {
                const availableQuantity = (variant.Quantity || 0) - (variant.ReservedQuantity || 0);

                if (quantity > availableQuantity) {
                    invalidSelections.push(`${variant.Size?.Name || 'Size ' + sizeId} (Available: ${availableQuantity})`);
                } else {
                    newItems.push({
                        tempId: Math.random(),
                        variant: variant,
                        quantity: quantity,
                        price: price,
                        subtotal: quantity * price
                    });
                }
            }
        });

        if (invalidSelections.length > 0) {
            alert(`${t.orders.insufficientStock || 'Insufficient Stock'}\n- ${invalidSelections.join('\n- ')}\n\n${t.orders.pleaseReduceQuantity || 'Please reduce quantity.'}`);
            return;
        }

        setStagedItems(prev => {
            const updatedItems = [...prev];
            newItems.forEach(newItem => {
                // Only merge if BOTH variant AND price match
                const existingIndex = updatedItems.findIndex(
                    existing => existing.variant.Id === newItem.variant.Id && existing.price === newItem.price
                );

                if (existingIndex >= 0) {
                    // Update existing item with same variant and same price
                    const existing = updatedItems[existingIndex];
                    const newQty = existing.quantity + newItem.quantity;
                    updatedItems[existingIndex] = {
                        ...existing,
                        quantity: newQty,
                        subtotal: newQty * existing.price // Use existing price since they match
                    };
                } else {
                    // Add as new item (different variant or different price)
                    updatedItems.push(newItem);
                }
            });
            return updatedItems;
        });
        setSelectedSizeIds([]);
    };

    const removeStagedItem = (tempId: number) => {
        setStagedItems(prev => prev.filter(x => x.tempId !== tempId));
    };

    const handleConfirm = () => {
        // Transform StagedItems to what parent expects
        // But wait, the parent expects (variant, qty, price). 
        // We need to change the interface of onConfirm to support arrays or call it multiple times.
        // For now, let's assume we modify the interface.
        // Since I cannot modify prop interface in this tool call without replacing the whole file header,
        // I will do my best to match the new plan. 
        // The Plan said: "Update handleVariantConfirm to accept an array of items" in Parent.
        // So I will call onConfirm with an array here? 
        // The Prop definition is at the top. I need to change that too.

        // Actually, I am replacing the WHOLE COMPONENT, but I need to make sure I update the interface definition line too? 
        // Wait, the tool 'replace_file_content' replaces a BLOCK. I need to replace the Interface as well.
        // I will use 'multi_replace' or just include the interface in the replacement if I target the whole file? 
        // The prompt says "Showing lines 1 to 220". I can replace the whole file content basically.

        // I will invoke the prop with the array.
        // @ts-ignore - Temporary until I fix the interface in the next chunk or same file
        onConfirm(stagedItems);
        onClose();
    };

    const isStageReady = selectedColorId && selectedSizeIds.length > 0 && quantity > 0 && price >= 0;
    const isConfirmReady = stagedItems.length > 0;
    const totalStagedAmount = stagedItems.reduce((acc, item) => acc + item.subtotal, 0);

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-start md:items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-black/20 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                            {product.Name}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{t.orders.selectionMode}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row flex-1 overflow-y-auto lg:overflow-hidden min-h-0">
                    {/* Left Panel: Selection Controls */}
                    <div className="lg:flex-1 p-4 sm:p-6 lg:overflow-y-auto custom-scrollbar lg:border-r border-gray-100 dark:border-gray-700 shrink-0">
                        {/* Product Info */}
                        <div className="flex gap-4 mb-6">
                            <div className="size-16 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                                style={{ backgroundImage: `url('${product.ThumbnailUrl || product.ImageUrls?.[0] || 'https://via.placeholder.com/150'}')` }}>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.Description}</p>
                                <p className="mt-1 font-mono text-xs text-gray-400">ID: {product.Id}</p>
                            </div>
                        </div>

                        {/* Color Selection */}
                        {uniqueColors.length > 0 && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.orders.selectColor}</label>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueColors.map(color => (
                                        <button
                                            key={color.Id}
                                            onClick={() => {
                                                setSelectedColorId(color.Id);
                                                const relevantSizeIds = variants
                                                    .filter(v => v.ProductColorId === color.Id && v.ProductSizeId)
                                                    .map(v => v.ProductSizeId);
                                                // @ts-ignore
                                                setSelectedSizeIds([...new Set(relevantSizeIds)]);
                                            }}
                                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all flex items-center gap-2
                                                ${selectedColorId === color.Id
                                                    ? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
                                                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary/50'
                                                }`}
                                        >
                                            <div className="size-3 rounded-full border border-gray-300 shadow-sm" style={{ backgroundColor: color.HexCode }}></div>
                                            {color.Name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Size Selection */}
                        {uniqueSizes.length > 0 && (
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{t.orders.selectSizes}</label>
                                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded">{t.orders.multiSelectEnabled}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {uniqueSizes.map(size => {
                                        const isSelected = selectedSizeIds.includes(size.Id);
                                        // Find variant for currently selected color (if any) and this size to show available qty
                                        let availableQty: number | null = null;
                                        if (selectedColorId) {
                                            const variant = variants.find(v => v.ProductColorId === selectedColorId && v.ProductSizeId === size.Id);
                                            if (variant) {
                                                availableQty = (variant.Quantity || 0) - (variant.ReservedQuantity || 0);
                                            }
                                        }

                                        const isDisabled = availableQty !== null && quantity > availableQty;

                                        return (
                                            <button
                                                key={size.Id}
                                                disabled={isDisabled}
                                                onClick={() => {
                                                    setSelectedSizeIds(prev =>
                                                        prev.includes(size.Id)
                                                            ? prev.filter(id => id !== size.Id)
                                                            : [...prev, size.Id]
                                                    );
                                                }}
                                                className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                                                    ${isSelected
                                                        ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30'
                                                        : isDisabled
                                                            ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700'
                                                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <span>{size.Name}</span>
                                                {availableQty !== null && (
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                        {availableQty}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {selectedSizeIds.length === 0 && <p className="text-xs text-red-400 dark:text-red-400 mt-1">{t.orders.selectAtLeastOneSize}</p>}
                            </div>
                        )}

                        {/* Quantity and Price */}
                        <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.orders.quantityPerSize}</label>
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm dark:text-gray-400">remove</span>
                                    </button>
                                    <input
                                        type="number"
                                        onFocus={(e) => e.target.select()}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full text-center py-2 bg-white dark:bg-gray-900 border-x border-gray-300 dark:border-gray-600 focus:outline-none text-gray-900 dark:text-white"
                                    />
                                    <button
                                        onClick={() => setQuantity(quantity + 1)}
                                        className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm dark:text-gray-400">add</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">{t.orders.unitPrice}</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 font-bold">{taka}</span>
                                    <input
                                        type="number"
                                        onFocus={(e) => e.target.select()}
                                        value={price}
                                        onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-primary focus:ring-primary text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Internal Add Button */}
                        <button
                            onClick={handleStageItems}
                            disabled={!isStageReady}
                            className={`w-full mt-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all
                                ${isStageReady
                                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:shadow-lg hover:-translate-y-0.5'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <span className="material-symbols-outlined">queue</span>
                            {t.orders.addToList}
                        </button>
                    </div>

                    {/* Right Panel: Staging List */}
                    {stagedItems.length > 0 && (
                        <div className="w-full lg:w-96 bg-gray-50/50 dark:bg-black/20 flex flex-col border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700 shrink-0 lg:h-full">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">shopping_basket</span>
                                    {t.orders.selectedItems}
                                </h4>
                                <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{stagedItems.length}</span>
                            </div>

                            <div className="flex-1 lg:overflow-y-auto overflow-visible p-4 space-y-3 custom-scrollbar">
                                {stagedItems.map((item) => (
                                    <div key={item.tempId} className="bg-white dark:bg-[var(--color-surface-dark-card)] border border-gray-100 dark:border-gray-700 rounded-xl p-3 shadow-sm relative group animate-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                {item.variant.Color && (
                                                    <div className="size-3 rounded-full border border-gray-200" style={{ backgroundColor: item.variant.Color.HexCode }}></div>
                                                )}
                                                <span className="font-bold text-gray-800 dark:text-white text-sm">
                                                    {item.variant.Size?.Name} <span className="text-gray-400 font-normal">{t.common.in || 'in'} {item.variant.Color?.Name}</span>
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => removeStagedItem(item.tempId)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-base">close</span>
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <div className="text-xs text-gray-500">
                                                {item.quantity} x ${item.price}
                                            </div>
                                            <div className="font-bold text-primary">
                                                ${item.subtotal.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="p-4 bg-white dark:bg-[var(--color-surface-dark-card)] border-t border-gray-100 dark:border-gray-700 shrink-0">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-sm text-gray-500">{t.orders.totalAmount}</span>
                                    <span className="text-xl font-bold text-gray-800 dark:text-white">${totalStagedAmount.toFixed(2)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={onClose}
                                        className="px-4 py-2 rounded-lg font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleConfirm}
                                        disabled={!isConfirmReady}
                                        className={`px-4 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 text-sm
                                            ${isConfirmReady
                                                ? 'bg-primary hover:bg-primary-dark hover:shadow-primary/30 hover:-translate-y-0.5'
                                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                            }`}
                                    >
                                        <span className="material-symbols-outlined">check</span>
                                        {t.common.confirm}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    , document.body);
}
