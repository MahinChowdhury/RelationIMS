import { useState, useEffect, useMemo } from 'react';
import { type Product, type ProductVariant } from '../../types';

interface VariantSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
    variants: ProductVariant[];
    onConfirm: (variant: ProductVariant, quantity: number, price: number) => void;
}

export default function VariantSelectionModal({ isOpen, onClose, product, variants, onConfirm }: VariantSelectionModalProps) {
    const [selectedColorId, setSelectedColorId] = useState<number | null>(null);
    const [selectedSizeId, setSelectedSizeId] = useState<number | null>(null);
    const [quantity, setQuantity] = useState<number>(1);
    const [price, setPrice] = useState<number>(0);

    // Reset state when product changes
    useEffect(() => {
        if (isOpen && product) {
            setQuantity(1);
            setPrice(product.BasePrice);
            setSelectedColorId(null);
            setSelectedSizeId(null);

            // Auto-select if only one option exists
            if (variants.length === 1) {
                const v = variants[0];
                setSelectedColorId(v.ProductColorId);
                setSelectedSizeId(v.ProductSizeId);
                setPrice(v.VariantPrice || product.BasePrice);
            }
        }
    }, [isOpen, product, variants]);

    // Extract unique colors and sizes from variants
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

    // Find the currently selected variant
    const selectedVariant = useMemo(() => {
        return variants.find(v => v.ProductColorId === selectedColorId && v.ProductSizeId === selectedSizeId);
    }, [variants, selectedColorId, selectedSizeId]);

    // Update price when variant options change
    useEffect(() => {
        if (selectedVariant) {
            setPrice(selectedVariant.VariantPrice || product?.BasePrice || 0);
        }
    }, [selectedVariant, product]);

    if (!isOpen || !product) return null;

    const handleConfirm = () => {
        if (selectedVariant) {
            onConfirm(selectedVariant, quantity, price);
            onClose();
        }
    };

    const isReady = !!selectedVariant && quantity > 0 && price >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1a2e22] w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-black/20">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white truncate pr-4">
                        {product.Name}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {/* Product Info */}
                    <div className="flex gap-4 mb-6">
                        <div className="size-20 rounded-lg bg-gray-100 dark:bg-gray-700 shrink-0 border border-gray-200 dark:border-gray-600 bg-cover bg-center"
                            style={{ backgroundImage: `url('${product.ImageUrls?.[0] || 'https://via.placeholder.com/150'}')` }}>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.Description}</p>
                            <p className="mt-1 font-mono text-xs text-gray-400">ID: {product.Id}</p>
                        </div>
                    </div>

                    {/* Color Selection */}
                    {uniqueColors.length > 0 && (
                        <div className="mb-6">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Color</label>
                            <div className="flex flex-wrap gap-2">
                                {uniqueColors.map(color => (
                                    <button
                                        key={color.Id}
                                        onClick={() => setSelectedColorId(color.Id)}
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
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Select Size</label>
                            <div className="flex flex-wrap gap-2">
                                {uniqueSizes.map(size => (
                                    <button
                                        key={size.Id}
                                        onClick={() => setSelectedSizeId(size.Id)}
                                        className={`px-4 py-1.5 rounded-lg border text-sm font-medium transition-all
                                            ${selectedSizeId === size.Id
                                                ? 'border-primary bg-primary text-white shadow-lg shadow-primary/30'
                                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/5'
                                            }`}
                                    >
                                        {size.Name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quantity and Price */}
                    <div className="grid grid-cols-2 gap-4 mb-2">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Quantity</label>
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">remove</span>
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="w-full text-center py-2 bg-white dark:bg-gray-900 border-x border-gray-300 dark:border-gray-600 focus:outline-none"
                                />
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">add</span>
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Unit Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                                    className="w-full pl-7 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 focus:border-primary focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Warning */}
                    {selectedVariant && (
                        <div className="mt-2 text-xs text-right">
                            <span className={`${selectedVariant.Quantity > 0 ? 'text-green-600' : 'text-red-500'} font-medium`}>
                                {selectedVariant.Quantity} available in stock
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-black/20 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 rounded-lg font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!isReady}
                        className={`px-6 py-2 rounded-lg font-bold text-white shadow-lg transition-all flex items-center gap-2
                            ${isReady
                                ? 'bg-primary hover:bg-primary-dark hover:shadow-primary/30 hover:-translate-y-0.5'
                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                        Add to Order - ${(price * quantity).toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
}
