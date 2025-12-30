import { ProductForm } from './ProductForm';
import type { Product, StockItem } from '../../types';



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
    // const fileInputRef = useRef<HTMLInputElement>(null);

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

                <ProductForm
                    product={product}
                    categories={categories}
                    brands={brands}
                    colors={colors}
                    availableSizes={availableSizes}
                    stockItems={stockItems}
                    selectedImages={selectedImages}
                    onChange={onChange}
                    onCategoryChange={onCategoryChange}
                    onImagesSelected={onImagesSelected}
                    removeImage={removeImage}
                    newStock={newStock}
                    setNewStock={setNewStock}
                    addStock={addStock}
                    removeStock={removeStock}
                    editingStockIndex={editingStockIndex}
                    editedStock={editedStock}
                    setEditedStock={setEditedStock}
                    saveStockEdit={saveStockEdit}
                    cancelStockEdit={cancelStockEdit}
                    startStockEdit={startStockEdit}
                    getColorHex={getColorHex}
                />

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
    );
}
