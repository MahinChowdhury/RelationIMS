import { useRef } from 'react';
import type { StockItem, Product } from '../../types';

interface ProductFormProps {
    product: Product;
    categories: any[];
    brands: any[];
    colors: any[];
    availableSizes: any[];
    stockItems: StockItem[];
    selectedImages: string[];

    onChange: (field: string, value: any) => void;
    onCategoryChange: (id: number) => void;

    onImagesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (img: string) => void;

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
}

export function ProductForm({
    product, categories, brands, colors, availableSizes, stockItems, selectedImages,
    onChange, onCategoryChange,
    onImagesSelected, removeImage,
    newStock, setNewStock, addStock, removeStock,
    editingStockIndex, editedStock, setEditedStock, saveStockEdit, cancelStockEdit, startStockEdit,
    getColorHex
}: ProductFormProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Images Section */}
                <div className="lg:col-span-4 flex flex-col gap-3">
                    <label className="block text-sm font-bold text-[#0e1b12] dark:text-gray-200">Product Image</label>
                    <div
                        className="flex-1 w-full min-h-[200px] border-2 border-dashed border-[#d0e7d7] rounded-xl flex flex-col items-center justify-center p-6 cursor-pointer hover:border-[#4e9767] hover:bg-[#primary]/5 transition-all group bg-white/40 dark:bg-black/20"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-[#4e9767] mb-2 transition-colors">cloud_upload</span>
                        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                            <span className="font-bold text-[#4e9767]">Click to upload</span> or drag and drop
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

                    {/* Preview */}
                    {selectedImages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {selectedImages.map((img, idx) => (
                                <div key={idx} className="relative w-16 h-16 border border-gray-200 rounded-lg overflow-hidden group">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img)}
                                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Form Fields */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Product Name</label>
                        <input
                            type="text"
                            value={product.Name}
                            onChange={(e) => onChange('Name', e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5 placeholder-gray-400"
                            placeholder="e.g., Organic Hemp T-Shirt"
                        />
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Category</label>
                        <select
                            value={product.CategoryId}
                            onChange={(e) => {
                                const val = e.target.value;
                                onChange('CategoryId', val);
                                onCategoryChange(Number(val));
                            }}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                        >
                            <option value={0}>Select Category</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Brand</label>
                        <select
                            value={product.BrandId}
                            onChange={(e) => onChange('BrandId', e.target.value)}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                        >
                            <option value={0}>Select Brand</option>
                            {brands.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Base Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={product.BasePrice}
                            onChange={(e) => onChange('BasePrice', parseFloat(e.target.value))}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Cost Price ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={product.CostPrice}
                            onChange={(e) => onChange('CostPrice', parseFloat(e.target.value))}
                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-sm rounded-lg focus:ring-[#4e9767] focus:border-[#4e9767] block w-full p-2.5"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">MSRP ($)</label>
                        <input
                            type="number"
                            step="0.01"
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
                <label className="block mb-1.5 text-sm font-bold text-[#0e1b12] dark:text-gray-200">Description</label>
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
                        Initial Stock Levels
                    </h3>
                </div>

                {/* Stock Input Row */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Color</label>
                        <div className="flex items-center gap-2">
                            <select
                                value={newStock.color}
                                onChange={(e) => setNewStock({ ...newStock, color: e.target.value })}
                                className="flex-1 bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767]"
                            >
                                <option value="" disabled hidden>Select</option>
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
                        <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Size</label>
                        <select
                            value={newStock.size}
                            onChange={(e) => setNewStock({ ...newStock, size: e.target.value })}
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767]"
                        >
                            <option value="" disabled hidden>Select</option>
                            {availableSizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Quantity</label>
                        <input
                            type="number"
                            value={newStock.quantity}
                            onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })}
                            min="0"
                            className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-sm rounded-lg p-2 focus:ring-[#4e9767]"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            type="button"
                            onClick={addStock}
                            className="w-full px-4 py-2 bg-[#4e9767] hover:bg-[#3d7a52] text-white rounded-lg font-bold transition-all"
                        >
                            + Add Variant
                        </button>
                    </div>
                </div>

                {/* Stock List Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {stockItems.map((s, i) => (
                        <div key={i} className="bg-white/40 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/10 p-4 flex flex-col gap-2 hover:border-[#4e9767]/50 transition-colors group relative">
                            {/* Actions Overlay */}
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={() => startStockEdit(i, s)}
                                    className="p-1 bg-white dark:bg-gray-800 rounded shadow text-gray-500 hover:text-[#4e9767]"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
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

                            {editingStockIndex === i ? (
                                <div className="flex items-center gap-2 mt-1">
                                    <input
                                        type="number"
                                        value={editedStock.quantity}
                                        onChange={(e) => setEditedStock({ ...editedStock, quantity: parseInt(e.target.value) })}
                                        className="w-full text-center text-xl font-bold p-1 rounded-lg border-gray-200 bg-white"
                                    />
                                    <button onClick={() => saveStockEdit(i)} className="text-green-600 font-bold text-xs">OK</button>
                                    <button onClick={cancelStockEdit} className="text-red-500 font-bold text-xs">X</button>
                                </div>
                            ) : (
                                <div className="mt-1">
                                    <div className="w-full text-center text-xl font-bold p-2 text-[#0e1b12] dark:text-white">
                                        {s.quantity} <span className="text-xs font-normal text-gray-500">Units</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {stockItems.length === 0 && (
                        <div className="col-span-full py-8 text-center text-gray-400 text-sm border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                            No stock variants added yet. Add a variant above.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
