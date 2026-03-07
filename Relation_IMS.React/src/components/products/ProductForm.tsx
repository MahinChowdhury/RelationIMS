import { useRef, useState, useEffect } from 'react';
import type { StockItem, Product } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';


interface ProductFormProps {
    product: Product;
    categories: any[];
    brands: any[];
    quarters: any[];
    colors: any[];
    availableSizes: any[];
    stockItems: StockItem[];
    selectedImages: string[];

    onChange: (field: string, value: any) => void;
    onCategoryChange: (id: number) => void;

    onImagesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (img: string) => void;
    reorderImages: (newOrder: string[]) => void;

    newStock: StockItem;
    setNewStock: (stock: StockItem) => void;
    addStock: () => void;
    removeStock: (index: number) => void;

    editingStockIndex: number | null;
    editedStock: StockItem;
    setEditedStock: (stock: StockItem) => void;
    saveStockEdit: (index: number) => void;
    cancelStockEdit: () => void;
    startStockEdit: (index: number, stock: StockItem) => void;

    getColorHex: (name: string) => string | null;
    isLotMode?: boolean;
}

export function ProductForm({
    product, categories, brands, quarters, colors, availableSizes, stockItems, selectedImages,
    onChange, onCategoryChange,
    onImagesSelected, removeImage, reorderImages,
    newStock, setNewStock, addStock, removeStock,
    editingStockIndex, editedStock, setEditedStock, saveStockEdit, cancelStockEdit, startStockEdit,
    getColorHex, isLotMode = false
}: ProductFormProps) {
    const { t } = useLanguage();
    const fileInputRef = useRef<HTMLInputElement>(null);



    // Filter brands by selected category
    const [filteredBrands, setFilteredBrands] = useState<any[]>([]);

    useEffect(() => {
        if (product.CategoryId && product.CategoryId !== 0) {
            const filtered = brands.filter(b => b.Categories?.some((c: any) => Number(c.Id) === Number(product.CategoryId)));
            setFilteredBrands(filtered);

            // Reset brand selection if current brand doesn't match category
            if (product.BrandId && !filtered.some(b => b.Id === product.BrandId)) {
                onChange('BrandId', 0);
            }
        } else {
            setFilteredBrands(brands);
        }
    }, [product.CategoryId, brands]);


    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Images Section */}
                <div className="lg:col-span-4 flex flex-col gap-3 self-start">
                    <label className="block text-sm font-bold text-[#0e1b12] dark:text-gray-200">Product Image</label>
                    <div
                        className="flex-1 w-full min-h-[120px] border-2 border-dashed border-[#d0e7d7] rounded-xl flex flex-col items-center justify-center p-4 cursor-pointer hover:border-[#4e9767] hover:bg-[#primary]/5 transition-all group bg-white/40 dark:bg-black/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-[#4e9767] mb-2 transition-colors">cloud_upload</span>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-[#4e9767]">{t.products.uploadClick}</span> {t.products.dragAndDrop}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1">SVG, PNG, JPG (max 2MB)</p>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        onChange={onImagesSelected}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />

                    {/* Preview - Image Column */}
                    {selectedImages.length > 0 && (
                        <div className="mt-2 max-h-[320px] overflow-y-auto">
                            <div className="flex flex-col gap-2">
                                {selectedImages.map((img, idx) => (
                                    <ImageItem
                                        key={img}
                                        src={img}
                                        index={idx}
                                        totalImages={selectedImages.length}
                                        onRemove={() => removeImage(img)}
                                        onReorder={(newIndex) => {
                                            if (newIndex === idx) return;
                                            const newOrder = [...selectedImages];
                                            const [movedItem] = newOrder.splice(idx, 1);
                                            newOrder.splice(newIndex, 0, movedItem);
                                            reorderImages(newOrder);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Form Fields */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.common.name}</label>
                        <input
                            type="text"
                            value={product.Name}
                            onChange={(e) => onChange('Name', e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5 placeholder-gray-400"
                            placeholder="e.g., Organic Hemp T-Shirt"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.category}</label>
                        <select
                            value={product.CategoryId}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                onChange('CategoryId', val);
                                onCategoryChange(val);
                            }}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5 cursor-pointer"
                        >
                            <option value={0}>{t.common.search} {t.products.category}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.brand}</label>
                        <select
                            value={product.BrandId}
                            onChange={(e) => onChange('BrandId', e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5 cursor-pointer"
                            disabled={!product.CategoryId || product.CategoryId === 0}
                        >
                            <option value={0}>{!product.CategoryId || product.CategoryId === 0 ? `${t.common.search} ${t.products.category} ${t.common.first || 'First'}` : `${t.common.search} ${t.products.brand}`}</option>
                            {filteredBrands.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.quarter}</label>
                        <div className="flex flex-col gap-2 max-h-32 overflow-y-auto bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5">
                            {quarters.map((q: any) => (
                                <label key={q.Id} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={product.QuarterIds?.includes(q.Id) || false}
                                        onChange={(e) => {
                                            const id = q.Id;
                                            const currentIds = product.QuarterIds || [];
                                            const newIds = e.target.checked
                                                ? [...currentIds, id]
                                                : currentIds.filter((cid: number) => cid !== id);
                                            onChange('QuarterIds', newIds);
                                        }}
                                        className="w-4 h-4 text-[#17cf54] rounded focus:ring-[#17cf54] dark:bg-black/20 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-[#0e1b12] dark:text-white">{q.Name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.costPrice} ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            onFocus={(e) => e.target.select()}
                            value={product.CostPrice}
                            onChange={(e) => onChange('CostPrice', parseFloat(e.target.value))}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.basePrice} ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            onFocus={(e) => e.target.select()}
                            value={product.BasePrice}
                            onChange={(e) => onChange('BasePrice', parseFloat(e.target.value))}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.products.msrp} ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            onFocus={(e) => e.target.select()}
                            value={product.MSRP}
                            onChange={(e) => onChange('MSRP', parseFloat(e.target.value))}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                            placeholder="0.00"
                        />
                    </div>
                </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent"></div>

            {/* Application Description */}
            <div>
                <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">{t.common.description}</label>
                <textarea
                    value={product.Description}
                    onChange={(e) => onChange('Description', e.target.value)}
                    rows={3}
                    className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5 resize-none"
                    placeholder="Product details..."
                ></textarea>
            </div>


            {/* Stock Levels */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[#4e9767]">inventory</span>
                        {isLotMode ? t.products.defineLotVariants : t.products.initialStockLevels}
                    </h3>
                </div>

                {/* Stock Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <label className="text-xs font-bold mb-1 block uppercase text-gray-500">{t.products.color}</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={newStock.color}
                                onChange={(e) => setNewStock({ ...newStock, color: e.target.value })}
                                className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767] cursor-pointer"
                            >
                                <option value="" disabled hidden>{t.common.search}</option>
                                {colors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            {getColorHex(newStock.color) && (
                                <span
                                    className="inline-block w-8 h-8 rounded-lg border border-gray-300 flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: getColorHex(newStock.color)! }}
                                ></span>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-1 block uppercase text-gray-500">{t.products.size}</label>
                        <select
                            value={newStock.size}
                            onChange={(e) => setNewStock({ ...newStock, size: e.target.value })}
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767] cursor-pointer"
                        >
                            <option value="" disabled hidden>{t.common.search}</option>
                            {availableSizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    {!isLotMode && (
                        <div>
                            <label className="text-xs font-bold mb-1 block uppercase text-gray-500">{t.common.quantity}</label>
                            <input
                                type="number"
                                onFocus={(e) => e.target.select()}
                                value={newStock.quantity}
                                onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })}
                                min="0"
                                className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767]"
                            />
                        </div>
                    )}

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={addStock}
                            className="w-full px-4 py-2 bg-[#4e9767] hover:bg-[#3d7a52] text-white rounded-lg font-bold transition-all"
                        >
                            {t.products.addStockVariant}
                        </button>
                    </div>
                </div>

                {/* Stock List Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stockItems.map((s, i) => (
                        <div key={i} className="bg-white/40 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10 p-4 flex flex-col gap-2 hover:border-[#4e9767]/50 transition-colors group relative">
                            {/* Actions Overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                {!isLotMode && (
                                    <button
                                        onClick={() => startStockEdit(i, s)}
                                        className="p-1 bg-white dark:bg-gray-800 rounded shadow text-gray-500 hover:text-[#4e9767]"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                    </button>
                                )}
                                <button
                                    onClick={() => removeStock(i)}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-gray-500 hover:text-red-500"
                                >
                                    <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getColorHex(s.color) && (
                                        <span className="w-4 h-4 rounded-full border border-gray-200" style={{ background: getColorHex(s.color)! }}></span>
                                    )}
                                    <span className="font-bold text-lg text-[#0e1b12] dark:text-white">{s.size}</span>
                                </div>
                                <span className="text-[10px] uppercase tracking-wider text-text-secondary bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">{s.color}</span>
                            </div>

                            {(!isLotMode) ? (
                                editingStockIndex === i ? (
                                    <div className="flex items-center gap-2 mt-1">
                                        <input
                                            type="number"
                                            onFocus={(e) => e.target.select()}
                                            value={editedStock.quantity}
                                            onChange={(e) => setEditedStock({ ...editedStock, quantity: parseInt(e.target.value) })}
                                            className="w-full text-center text-xl font-bold p-1 rounded-lg border-gray-200 bg-white"
                                        />
                                        <button onClick={() => saveStockEdit(i)} className="text-green-600 font-bold text-xs">{t.common.ok || 'OK'}</button>
                                        <button onClick={cancelStockEdit} className="text-red-500 font-bold text-xs">{t.common.cancel || 'X'}</button>
                                    </div>
                                ) : (
                                    <div className="mt-1">
                                        <div className="w-full text-center text-xl font-bold p-2 text-[#0e1b12] dark:text-white">
                                            {s.quantity} <span className="text-xs font-normal text-gray-500">{t.common.units || 'Units'}</span>
                                        </div>
                                    </div>
                                )
                            ) : null}
                        </div>
                    ))}

                    {stockItems.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            {t.products.noVariantsFound}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface ImageItemProps {
    src: string;
    index: number;
    totalImages: number;
    onRemove: () => void;
    onReorder: (newIndex: number) => void;
}

function ImageItem({ src, index, totalImages, onRemove, onReorder }: ImageItemProps) {
    return (
        <div className="relative flex items-center gap-3 p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-black/20 group">
            <select
                value={index}
                onChange={(e) => onReorder(Number(e.target.value))}
                className="w-16 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-1 text-center font-bold focus:ring-[#4e9767] cursor-pointer"
            >
                {Array.from({ length: totalImages }).map((_, i) => (
                    <option key={i} value={i}>{i + 1}</option>
                ))}
            </select>
            <div className="w-20 h-20 rounded border border-gray-200 dark:border-gray-600 overflow-hidden flex-shrink-0">
                <img src={src} className="w-full h-full object-cover" alt="" />
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="ml-auto p-1 bg-red-100 dark:bg-red-900/30 text-red-500 rounded hover:bg-red-500 hover:text-white transition-colors"
                title="Remove image"
            >
                <span className="material-symbols-outlined text-[14px]">delete</span>
            </button>
        </div>
    );
}
