import { useRef } from 'react';

// Common Types (can be moved to types file)
export interface StockItem {
    id?: number;
    color: string;
    size: string;
    quantity: number;
}

export interface Product {
    Id: number | null;
    Name: string;
    Description: string;
    BasePrice: number;
    CategoryId: number | string;
    BrandId: number | string;
    ImageUrls?: string[];
}

// ------ DELETE MODAL ------
export function DeleteProductModal({ show, onCancel, onConfirm }: { show: boolean, onCancel: () => void, onConfirm: () => void }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-[90%] max-w-md border-2 border-[#d0e7d7] transform transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] text-xl font-black">Confirm Deletion</h2>
                        <p className="text-[#4e9767] text-sm">This action cannot be undone</p>
                    </div>
                </div>
                <p className="text-[#0e1b12] text-base mb-6 leading-relaxed">
                    Are you sure you want to delete this product? All associated data will be permanently removed.
                </p>
                <div className="flex justify-end gap-3">
                    <button onClick={onCancel} className="px-6 py-3 rounded-xl text-[#0e1b12] bg-[#e7f3eb] hover:bg-[#d0e7d7] font-semibold transition-all shadow-md hover:shadow-lg">Cancel</button>
                    <button onClick={onConfirm} className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold transition-all shadow-md hover:shadow-lg">Delete Product</button>
                </div>
            </div>
        </div>
    );
}

// ------ PRODUCT FORM (CREATE/EDIT) ------
// Reused for both create and edit to reduce duplication since they are very similar in the HTML
interface ProductFormModalProps {
    show: boolean;
    mode: 'create' | 'edit';
    product: Product;
    categories: any[];
    brands: any[];
    colors: any[];
    availableSizes: any[];
    stockItems: StockItem[];
    selectedImages: string[];

    // Handlers
    onClose: () => void;
    onSave: () => void;
    onChange: (field: string, value: any) => void;
    onCategoryChange: (id: number) => void;

    // Image Handlers
    onImagesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (img: string) => void;

    // Stock Handlers
    newStock: StockItem;
    setNewStock: (stock: StockItem) => void;
    addStock: () => void;
    removeStock: (index: number) => void;
    saveStockEdit: (index: number) => void;
    cancelStockEdit: () => void;
    startStockEdit: (index: number, stock: StockItem) => void;

    editingStockIndex: number | null;
    editedStock: StockItem;
    setEditedStock: (stock: StockItem) => void;
    getColorHex: (name: string) => string | null;
}

export function ProductFormModal({
    show, mode, product, categories, brands, colors, availableSizes, stockItems, selectedImages,
    onClose, onSave, onChange, onCategoryChange,
    onImagesSelected, removeImage,
    newStock, setNewStock, addStock, removeStock,
    editingStockIndex, editedStock, setEditedStock, saveStockEdit, cancelStockEdit, startStockEdit,
    getColorHex
}: ProductFormModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!show) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 animate-fadeIn overflow-y-auto p-4">
            <div className="bg-white rounded-3xl shadow-2xl p-8 w-[95%] max-w-3xl border-2 border-[#d0e7d7] max-h-[95vh] overflow-y-auto relative my-8">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all text-2xl font-bold"
                    aria-label="Close"
                >
                    ×
                </button>

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mode === 'create' ? "M12 4v16m8-8H4" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] text-2xl font-black">{mode === 'create' ? 'Add New Product' : 'Edit Product'}</h2>
                        <p className="text-[#4e9767] text-sm font-medium">{mode === 'create' ? 'Create a new product entry' : 'Update product information'}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-5">
                    {/* Images Section */}
                    <div className="bg-gradient-to-br from-[#f8fcf9] to-white rounded-2xl p-6 border-2 border-[#e7f3eb]">
                        <label className="text-[#0e1b12] text-base font-bold mb-3 block flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#4e9767]" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                            </svg>
                            Product Images
                        </label>

                        <div
                            className="border-2 border-dashed border-[#d0e7d7] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-[#4e9767] hover:bg-[#f8fcf9] transition-all"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <svg className="w-10 h-10 text-[#4e9767] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-[#0e1b12] text-base font-semibold">Click to upload images</span>
                            <span className="text-[#4e9767] text-sm mt-1">PNG, JPG up to 10MB</span>
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
                        <div className="flex flex-wrap gap-4 mt-4">
                            {selectedImages.map((img, idx) => (
                                <div key={idx} className="relative w-28 h-28 border-2 border-[#d0e7d7] rounded-2xl overflow-hidden group shadow-md hover:shadow-lg transition-shadow">
                                    <img src={img} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(img)}
                                        className="absolute top-2 right-2 bg-red-500 text-white rounded-xl w-7 h-7 flex items-center justify-center text-sm hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Product Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {/* Category */}
                        <div>
                            <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Category</label>
                            <select
                                value={product.CategoryId}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    onChange('CategoryId', val);
                                    onCategoryChange(Number(val));
                                }}
                                name="category"
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            >
                                <option value={0}>Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Brand */}
                        <div>
                            <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Brand</label>
                            <select
                                value={product.BrandId}
                                onChange={(e) => onChange('BrandId', e.target.value)}
                                name="Brand"
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            >
                                <option value={0}>Select Brand</option>
                                {brands.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
                            </select>
                        </div>

                        {/* Name */}
                        <div className="md:col-span-2">
                            <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Product Name</label>
                            <input
                                type="text"
                                value={product.Name}
                                onChange={(e) => onChange('Name', e.target.value)}
                                name="name"
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all"
                            />
                        </div>

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Description</label>
                            <textarea
                                value={product.Description}
                                onChange={(e) => onChange('Description', e.target.value)}
                                name="description"
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-medium transition-all resize-none"
                            ></textarea>
                        </div>

                        {/* Base Price */}
                        <div>
                            <label className="text-[#0e1b12] text-sm font-bold mb-2 block">Base Price</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4e9767] font-bold">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={product.BasePrice}
                                    onChange={(e) => onChange('BasePrice', parseFloat(e.target.value))}
                                    name="price"
                                    className="w-full pl-8 pr-4 py-3 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] focus:border-transparent font-bold transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Section */}
                    <div className="bg-gradient-to-br from-[#f8fcf9] to-white rounded-2xl p-6 border-2 border-[#e7f3eb] max-h-[400px] overflow-y-auto">
                        <h3 className="text-[#0e1b12] text-xl font-black mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            Stock Levels
                        </h3>

                        {/* Input Row */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                            <div>
                                <label className="text-[#0e1b12] text-xs font-bold mb-1 block uppercase">Color</label>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={newStock.color}
                                        onChange={(e) => setNewStock({ ...newStock, color: e.target.value })}
                                        name="stockColor"
                                        className="flex-1 px-3 py-2.5 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] text-sm font-medium"
                                    >
                                        <option value="" disabled hidden>Select</option>
                                        {colors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                    {getColorHex(newStock.color) && (
                                        <span
                                            className="inline-block w-8 h-8 rounded-lg border-2 border-gray-300 flex-shrink-0 shadow-sm"
                                            style={{ backgroundColor: getColorHex(newStock.color)! }}
                                        ></span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="text-[#0e1b12] text-xs font-bold mb-1 block uppercase">Size</label>
                                <select
                                    value={newStock.size}
                                    onChange={(e) => setNewStock({ ...newStock, size: e.target.value })}
                                    name="stockSize"
                                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] text-sm font-medium"
                                >
                                    <option value="" disabled hidden>Select</option>
                                    {availableSizes.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-[#0e1b12] text-xs font-bold mb-1 block uppercase">Quantity</label>
                                <input
                                    type="number"
                                    value={newStock.quantity}
                                    onChange={(e) => setNewStock({ ...newStock, quantity: parseInt(e.target.value) })}
                                    name="stockQuantity"
                                    min="0"
                                    className="w-full px-3 py-2.5 rounded-xl bg-white border-2 border-[#e7f3eb] text-[#0e1b12] focus:outline-none focus:ring-2 focus:ring-[#4e9767] text-sm font-bold"
                                />
                            </div>

                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={addStock}
                                    className="w-full px-4 py-2.5 bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all"
                                >
                                    + Add
                                </button>
                            </div>
                        </div>

                        {/* Stock Table */}
                        <div className="overflow-x-auto rounded-2xl border-2 border-[#d0e7d7] shadow-lg">
                            <table className="w-full min-w-[600px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white">
                                        <th className="px-4 py-4 text-left text-sm font-bold uppercase">Color</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold uppercase">Size</th>
                                        <th className="px-4 py-4 text-left text-sm font-bold uppercase">Quantity</th>
                                        <th className="px-4 py-4 text-right text-sm font-bold uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {stockItems.map((s, i) => (
                                        <tr key={i} className="border-b border-[#e7f3eb] hover:bg-[#f8fcf9] transition-colors">
                                            {/* Color */}
                                            <td className="px-4 py-3">
                                                {editingStockIndex === i ? (
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={editedStock.color}
                                                            onChange={(e) => setEditedStock({ ...editedStock, color: e.target.value })}
                                                            className="px-2 py-1.5 rounded-lg bg-[#f8fcf9] border border-[#d0e7d7] text-[#0e1b12] text-sm font-medium"
                                                        >
                                                            {colors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                        </select>
                                                        {getColorHex(editedStock.color) && (
                                                            <span
                                                                className="inline-block w-6 h-6 rounded-lg border-2 border-gray-300 shadow-sm"
                                                                style={{ backgroundColor: getColorHex(editedStock.color)! }}
                                                            ></span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold">{s.color}</span>
                                                        {getColorHex(s.color) && (
                                                            <span
                                                                className="inline-block w-6 h-6 rounded-lg border-2 border-gray-300 shadow-sm"
                                                                style={{ backgroundColor: getColorHex(s.color)! }}
                                                            ></span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Size */}
                                            <td className="px-4 py-3">
                                                {editingStockIndex === i ? (
                                                    <select
                                                        value={editedStock.size}
                                                        onChange={(e) => setEditedStock({ ...editedStock, size: e.target.value })}
                                                        className="px-2 py-1.5 rounded-lg bg-[#f8fcf9] border border-[#d0e7d7] text-[#0e1b12] text-sm font-medium"
                                                    >
                                                        {availableSizes.map(sz => <option key={sz.id} value={sz.name}>{sz.name}</option>)}
                                                    </select>
                                                ) : (
                                                    <span className="font-semibold">{s.size}</span>
                                                )}
                                            </td>

                                            {/* Quantity */}
                                            <td className="px-4 py-3">
                                                {editingStockIndex === i ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={editedStock.quantity}
                                                        onChange={(e) => setEditedStock({ ...editedStock, quantity: parseInt(e.target.value) })}
                                                        className="w-24 px-2 py-1.5 rounded-lg bg-[#f8fcf9] border border-[#d0e7d7] text-[#0e1b12] text-sm font-bold"
                                                    />
                                                ) : (
                                                    <span className="px-3 py-1.5 bg-[#e7f3eb] text-[#4e9767] rounded-lg font-bold">{s.quantity}</span>
                                                )}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3 text-right">
                                                {editingStockIndex === i ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => saveStockEdit(i)}
                                                            className="px-3 py-1.5 bg-[#4e9767] text-white rounded-lg text-sm font-bold transition-all hover:bg-[#3d7a52]"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={cancelStockEdit}
                                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold transition-all hover:bg-red-600 ml-2"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => startStockEdit(i, s)}
                                                            className="px-3 py-1.5 bg-[#e7f3eb] text-[#4e9767] rounded-lg text-sm font-bold transition-all hover:bg-[#d0e7d7] mr-2"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeStock(i)}
                                                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-bold transition-all hover:bg-red-600"
                                                            title="Delete this variant"
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {stockItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-[#8c9a91] text-sm font-medium">
                                                No stock variants added yet
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#e7f3eb]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl text-[#0e1b12] bg-[#e7f3eb] hover:bg-[#d0e7d7] font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={onSave}
                            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white font-bold transition-all shadow-md hover:shadow-lg"
                        >
                            {mode === 'create' ? 'Create Product' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
