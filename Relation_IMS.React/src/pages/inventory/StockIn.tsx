import { useState, useEffect } from 'react';
import { ProductForm } from '../../components/products/ProductForm';
import BarcodeScanner from '../../components/BarcodeScanner';
import type { Product, StockItem } from '../../types';
import api from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';

export default function StockIn() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'existing' | 'new'>('existing');

    // --- Product Form State (Copied from Products.tsx / ProductModals logic) ---
    // In a real app, this should be a custom hook "useProductForm"
    const initialProductState = {
        Id: 0,
        Name: '',
        Description: '',
        BasePrice: 0,
        CategoryId: 0,
        BrandId: 0,
        ImageUrls: []
    };
    const [currentProduct, setCurrentProduct] = useState<Product>(initialProductState);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [availableSizes, setAvailableSizes] = useState<any[]>([]);

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [newStock, setNewStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });
    const [editingStockIndex, setEditingStockIndex] = useState<number | null>(null);
    const [editedStock, setEditedStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });

    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const handleScan = (code: string) => {
        setSearchQuery(code);
        setShowScanner(false);
        // Here you would typically trigger the search automatically
    };

    useEffect(() => {
        loadMetadata();
    }, []);

    const loadMetadata = async () => {
        try {
            const [catRes, brandRes, colorRes] = await Promise.all([
                api.get('/Category'),
                api.get('/Brand'),
                api.get('/ProductVariantColors')
            ]);
            setCategories(catRes.data.map((c: any) => ({ id: c.Id, name: c.Name })));
            setBrands(brandRes.data.map((b: any) => ({ Id: b.Id, Name: b.Name })));
            setColors(colorRes.data.map((c: any) => ({ id: c.Id, name: c.Name, hex: c.HexCode })));
        } catch (err) { console.error(err); }
    };

    const handleProductChange = (field: string, value: any) => {
        setCurrentProduct(prev => ({ ...prev, [field]: value }));
    };

    const onCategoryChange = async (categoryId: number) => {
        try {
            const res = await api.get(`/ProductVariantSizes/category/${categoryId}`);
            setAvailableSizes(res.data.map((s: any) => ({ id: s.Id, name: s.Name })));
        } catch (err) {
            setAvailableSizes([]);
        }
    };

    const onImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setImageFiles(prev => [...prev, ...files]);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (ev) => setSelectedImages(prev => [...prev, ev.target?.result as string]);
                reader.readAsDataURL(file);
            });
        }
    };

    const removeImage = (img: string) => {
        const idx = selectedImages.indexOf(img);
        if (idx > -1) {
            setSelectedImages(prev => prev.filter((_, i) => i !== idx));
            const fileIdx = idx - selectedImages.filter(im => im.startsWith('http')).length;
            if (fileIdx >= 0) setImageFiles(prev => prev.filter((_, i) => i !== fileIdx));
        }
    };

    const addStock = () => {
        if (!newStock.color || !newStock.size || newStock.quantity < 0) return;
        const exists = stockItems.find(s => s.color === newStock.color && s.size === newStock.size);
        if (exists) {
            setStockItems(stockItems.map(s => s === exists ? { ...s, quantity: newStock.quantity } : s));
        } else {
            setStockItems([...stockItems, { ...newStock }]);
        }
        setNewStock({ ...newStock, quantity: 0 }); // Keep color/size selected for easy bulk add, just reset quantity? Or reset all? User pref. Let's reset quantity.
    };

    const removeStock = (index: number) => {
        setStockItems(prev => prev.filter((_, i) => i !== index));
    };

    const startStockEdit = (index: number, stock: StockItem) => {
        setEditingStockIndex(index);
        setEditedStock(stock);
    };

    const saveStockEdit = (index: number) => {
        setStockItems(prev => prev.map((s, i) => i === index ? editedStock : s));
        setEditingStockIndex(null);
    };

    const createProduct = async () => {
        if (!currentProduct.Name || !currentProduct.CategoryId) {
            alert('Please fill in required fields');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Name', currentProduct.Name);
            formData.append('Description', currentProduct.Description || '');
            formData.append('BasePrice', currentProduct.BasePrice?.toString() || '0');
            formData.append('CategoryId', currentProduct.CategoryId.toString());
            formData.append('BrandId', currentProduct.BrandId.toString());

            imageFiles.forEach(file => formData.append('Images', file));

            const res = await api.post('/Product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const productId = res.data.id || res.data.Id;

            if (productId && stockItems.length > 0) {
                for (const stock of stockItems) {
                    const colorId = colors.find(c => c.name === stock.color)?.id;
                    const sizeId = availableSizes.find(s => s.name === stock.size)?.id;
                    if (colorId && sizeId) {
                        await api.post('/ProductVariants', {
                            ProductId: productId,
                            ProductColorId: colorId,
                            ProductSizeId: sizeId,
                            VariantPrice: currentProduct.BasePrice,
                            Quantity: stock.quantity,
                            DefaultInventoryId: 1
                        });
                    }
                }
            }

            alert('Product created successfully!');
            navigate('/products');

        } catch (e) {
            console.error(e);
            alert('Failed to create product');
        }
    };

    const getColorHex = (name: string) => colors.find(c => c.name === name)?.hex || null;

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f6f8f6] dark:bg-[#112116]">
            {/* Background blobs */}
            <div className="absolute blob bg-emerald-200/30 dark:bg-emerald-800/20 w-[500px] h-[500px] bottom-0 right-0 translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

            <div className="container mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 relative z-10">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                        <li className="inline-flex items-center">
                            <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-[#4e9767] hover:text-[#17cf54] dark:text-gray-400 dark:hover:text-white">
                                <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-[#4e9767] text-[18px]">chevron_right</span>
                                <Link to="/inventory" className="ms-1 text-sm font-medium text-[#4e9767] hover:text-[#17cf54] md:ms-2 dark:text-gray-400 dark:hover:text-white">Inventory</Link>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-[#4e9767] text-[18px]">chevron_right</span>
                                <span className="ms-1 text-sm font-bold text-[#0e1b12] md:ms-2 dark:text-white">Stock In</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                {/* Title */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0e1b12] dark:text-white tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#17cf54] text-3xl">input</span>
                            Stock Management
                        </h1>
                        <p className="text-[#4e9767] dark:text-gray-400 text-sm max-w-xl">
                            Register new incoming shipments. You can add stock to existing items or create entirely new product listings.
                        </p>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="bg-white/70 dark:bg-[#1a2e22]/60 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200/50 dark:border-white/10">
                        <button
                            onClick={() => setActiveTab('existing')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'existing'
                                    ? 'text-[#17cf54] border-b-2 border-[#17cf54] bg-[#17cf54]/5 dark:bg-[#17cf54]/10 font-bold'
                                    : 'text-gray-500 hover:text-[#17cf54] hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">search</span>
                            Existing Product
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'new'
                                    ? 'text-[#17cf54] border-b-2 border-[#17cf54] bg-[#17cf54]/5 dark:bg-[#17cf54]/10 font-bold'
                                    : 'text-gray-500 hover:text-[#17cf54] hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            New Product
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {activeTab === 'existing' ? (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                {/* Search Section */}
                                <div className="flex flex-col gap-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                            <span className="material-symbols-outlined text-gray-400 text-[24px]">search</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-lg rounded-xl focus:ring-[#17cf54] focus:border-[#17cf54] block w-full pl-12 p-4 placeholder-gray-400 shadow-sm transition-all"
                                            placeholder="Scan barcode or search by name/SKU..."
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => setShowScanner(true)}
                                            className="absolute inset-y-2 right-2 px-4 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                                            Scan
                                        </button>
                                    </div>
                                </div>

                                {/* Recent / Empty State */}
                                <div className="flex flex-col items-center justify-center py-12 text-center gap-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-white/5">
                                    <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm">
                                        <span className="material-symbols-outlined text-3xl text-gray-400">qr_code_scanner</span>
                                    </div>
                                    <div className="max-w-xs">
                                        <h3 className="text-base font-bold text-[#0e1b12] dark:text-white">Ready to Scan</h3>
                                        <p className="text-sm text-[#4e9767] dark:text-gray-400 mt-1">
                                            Scan a product barcode or enter a SKU to register new stock.
                                        </p>
                                    </div>
                                </div>

                                {showScanner && (
                                    <BarcodeScanner
                                        enabled={true}
                                        onScanned={handleScan}
                                        onClose={() => setShowScanner(false)}
                                    />
                                )}
                            </div>
                        ) : (
                            // New Product Form
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                <ProductForm
                                    product={currentProduct}
                                    categories={categories}
                                    brands={brands}
                                    colors={colors}
                                    availableSizes={availableSizes}
                                    stockItems={stockItems}
                                    selectedImages={selectedImages}
                                    onChange={handleProductChange}
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
                                    cancelStockEdit={() => setEditingStockIndex(null)}
                                    startStockEdit={startStockEdit}
                                    getColorHex={getColorHex}
                                />

                                <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-gray-200/50 dark:border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/inventory')}
                                        className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={createProduct}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#17cf54] hover:bg-[#12a542] rounded-lg shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        disabled={stockItems.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        Save Product & Stock
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
