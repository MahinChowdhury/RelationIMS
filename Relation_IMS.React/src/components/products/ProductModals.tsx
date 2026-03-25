import { createPortal } from 'react-dom';
import { useState } from 'react';
import { ProductForm } from './ProductForm';
import type { Product, StockItem } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';
import ConfirmDeleteInput from '../ConfirmDeleteInput';



// ------ DELETE MODAL ------
export function DeleteProductModal({ show, onCancel, onConfirm }: { show: boolean, onCancel: () => void, onConfirm: () => void }) {
    const { t } = useLanguage();
    const [isDeleting, setIsDeleting] = useState(false);

    if (!show) return null;

    const handleConfirm = async () => {
        setIsDeleting(true);
        await onConfirm();
        setIsDeleting(false);
    };

    return createPortal(
        <div className="fixed inset-0 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn p-4 md:p-0 pt-4 md:pt-0">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-3xl shadow-2xl p-8 w-[90%] max-w-md border-2 border-[var(--color-scrollbar)] dark:border-[var(--color-surface-dark-border)] transform transition-all">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center">
                        <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] dark:text-white text-xl font-black">{t.products.confirmDeletion}</h2>
                        <p className="text-secondary text-sm">{t.products.cannotBeUndone}</p>
                    </div>
                </div>
                <p className="text-[#0e1b12] dark:text-gray-300 text-base mb-6 leading-relaxed">
                    {t.products.deleteConfirmMessage}
                </p>
                <ConfirmDeleteInput
                    onConfirm={handleConfirm}
                    onCancel={onCancel}
                    isDeleting={isDeleting}
                    deleteButtonText={t.products.deleteProduct}
                />
            </div>
        </div>
    , document.body);
}

// ------ PRODUCT FORM (CREATE/EDIT) ------
// Reused for both create and edit to reduce duplication since they are very similar in the HTML
interface ProductFormModalProps {
    show: boolean;
    mode: 'create' | 'edit';
    product: Product;
    categories: any[];
    brands: any[];
    quarters: any[];
    colors: any[];
    availableSizes: any[];
    stockItems: StockItem[];
    selectedImages: string[];
    thumbnailMap?: Record<string, string>;

    // Handlers
    onClose: () => void;
    onSave: () => void;
    onChange: (field: string, value: any) => void;
    onCategoryChange: (id: number) => void;

    // Image Handlers
    onImagesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (img: string) => void;
    reorderImages: (newOrder: string[]) => void;

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
    show, mode, product, categories, brands, quarters, colors, availableSizes, stockItems, selectedImages,
    thumbnailMap,
    onClose, onSave, onChange, onCategoryChange,
    onImagesSelected, removeImage, reorderImages,
    newStock, setNewStock, addStock, removeStock,
    editingStockIndex, editedStock, setEditedStock, saveStockEdit, cancelStockEdit, startStockEdit,
    getColorHex
}: ProductFormModalProps) {
    const { t } = useLanguage();

    if (!show) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-start sm:items-center justify-center bg-black/60 backdrop-blur-sm z-[100] animate-fadeIn p-2 sm:p-4">
            <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-2xl sm:rounded-3xl shadow-2xl w-full sm:w-[95%] max-w-4xl border-2 border-[var(--color-scrollbar)] dark:border-[var(--color-surface-dark-border)] max-h-[calc(100dvh-1rem)] sm:max-h-[90dvh] flex flex-col relative my-1 sm:my-4">
                {/* Close Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all text-2xl font-bold z-10"
                    aria-label="Close"
                >
                    Ãƒâ€”
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 sm:gap-4 px-5 sm:px-8 pt-5 sm:pt-8 pb-4 shrink-0">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={mode === 'create' ? "M12 4v16m8-8H4" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-[#0e1b12] dark:text-white text-xl sm:text-2xl font-black">{mode === 'create' ? t.products.addProduct : t.products.editProduct}</h2>
                        <p className="text-secondary text-xs sm:text-sm font-medium">{mode === 'create' ? t.products.createProduct : t.products.productDetails}</p>
                    </div>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-8">
                    <ProductForm
                        product={product}
                        categories={categories}
                        brands={brands}
                        quarters={quarters}
                        colors={colors}
                        availableSizes={availableSizes}
                        stockItems={stockItems}
                        selectedImages={selectedImages}
                        thumbnailMap={thumbnailMap}
                        onChange={onChange}
                        onCategoryChange={onCategoryChange}
                        onImagesSelected={onImagesSelected}
                        removeImage={removeImage}
                        reorderImages={reorderImages}
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
                </div>

                {/* Action Buttons - always visible */}
                <div className="flex justify-end gap-3 px-5 sm:px-8 py-4 border-t-2 border-[#e7f3eb] dark:border-[var(--color-surface-dark-border)] shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl text-[#0e1b12] dark:text-gray-300 bg-[#e7f3eb] dark:bg-[#132219] hover:bg-[#d0e7d7] dark:hover:bg-white/5 font-bold transition-all shadow-md hover:shadow-lg"
                    >
                        {t.common.cancel}
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        className="px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base rounded-xl bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white font-bold transition-all shadow-md hover:shadow-lg"
                    >
                        {mode === 'create' ? t.products.createProduct : t.common.saveChanges}
                    </button>
                </div>
            </div>
        </div>
    , document.body);
}
