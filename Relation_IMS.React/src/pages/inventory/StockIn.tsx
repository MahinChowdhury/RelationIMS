import { useState, useEffect } from 'react';
import { ProductForm } from '../../components/products/ProductForm';
import { QuantityInput } from '../../components/QuantityInput';
import BarcodeScanner from '../../components/BarcodeScanner';
import type { Product, StockItem } from '../../types';
import api from '../../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

export default function StockIn() {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'existing' | 'new' | 'lot'>('existing');

    // --- Product Form State (Copied from Products.tsx / ProductModals logic) ---
    // In a real app, this should be a custom hook "useProductForm"
    const initialProductState = {
        Id: 0,
        Name: '',
        Description: '',
        BasePrice: 0,
        CostPrice: 0,
        MSRP: 0,
        CategoryId: 0,
        BrandId: 0,
        QuarterIds: [],
        ImageUrls: []
    };
    const [currentProduct, setCurrentProduct] = useState<Product>(initialProductState);
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [quarters, setQuarters] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [availableSizes, setAvailableSizes] = useState<any[]>([]);

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [newStock, setNewStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });
    const [editingStockIndex, setEditingStockIndex] = useState<number | null>(null);
    const [editedStock, setEditedStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });

    // Existing Product State
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [addStockQuantities, setAddStockQuantities] = useState<{ [variantId: number]: number }>({});
    const [editingQuarterIds, setEditingQuarterIds] = useState<number[]>([]);

    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [showScanner, setShowScanner] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [lotQuantity, setLotQuantity] = useState<number>(0);
    const [isExistingLotMode, setIsExistingLotMode] = useState(false);
    const [existingLotQuantity, setExistingLotQuantity] = useState<number>(0);

    const handleScan = async (code: string) => {
        setSearchQuery(code);
        setShowScanner(false);
        handleSearch(code);
    };

    const [newVariantsToCreate, setNewVariantsToCreate] = useState<any[]>([]);

    const handleSearch = async (term: string, isUpdate: boolean = false) => {
        if (!term) return;

        if (!isUpdate) {
            setLoadingProduct(true);
            setFoundProduct(null);
            setAddStockQuantities({});
            setNewVariantsToCreate([]);
        }

        try {
            // 1. Find Item by Code
            let productId = isUpdate && foundProduct ? foundProduct.Id : 0;

            if (!productId) {
                // Try to find by Item Code first
                try {
                    const itemRes = await api.get<any>(`/ProductItem/code/${term}`);
                    if (itemRes.data && itemRes.data.ProductId) {
                        productId = itemRes.data.ProductId;
                    }
                } catch (e) {
                    console.log("Not found by item code");
                }

                if (!productId) {
                    // Fallback: Check if term is a numeric ID (Product ID)
                    if (!isNaN(Number(term))) {
                        productId = Number(term);
                    } else {
                        alert(t.inventory.productNotFound);
                        setLoadingProduct(false);
                        return;
                    }
                }
            }

            // 2. Load Full Product Details
            const productRes = await api.get<Product>(`/Product/${productId}`);
            setFoundProduct(productRes.data);
            setEditingQuarterIds(productRes.data.Quarters?.map(q => q.Id) || []);

            // 3. Load Available Sizes for this Product's Category
            if (productRes.data.CategoryId) {
                onCategoryChange(productRes.data.CategoryId);
            }

        } catch (err) {
            console.error(err);
            if (!isUpdate) alert(t.inventory.failedToLoadDetails);
        } finally {
            setLoadingProduct(false);
        }
    };

    const handleAddStockChange = (variantId: number, qty: string) => {
        const val = parseInt(qty) || 0;
        setAddStockQuantities(prev => ({ ...prev, [variantId]: val }));
    };



    const submitAddStock = async () => {
        if (!foundProduct) return;

        const updates = Object.entries(addStockQuantities).filter(([_, qty]) => qty > 0);

        if (updates.length === 0 && newVariantsToCreate.length === 0 && !isExistingLotMode) {
            alert(t.inventory.noChangesToSave);
            return;
        }

        if (isExistingLotMode && existingLotQuantity <= 0) {
            alert(t.inventory.enterValidLotQty);
            return;
        }

        try {
            setIsSaving(true);

            // Check if QuarterIds were modified
            const originalQuarters = foundProduct.Quarters?.map(q => q.Id).sort().join(',') || '';
            const newQuarters = [...editingQuarterIds].sort().join(',');

            if (originalQuarters !== newQuarters) {
                // Perform product update
                await api.put(`/Product/${foundProduct.Id}`, {
                    Name: foundProduct.Name,
                    Description: foundProduct.Description,
                    BasePrice: foundProduct.BasePrice,
                    CostPrice: foundProduct.CostPrice,
                    MSRP: foundProduct.MSRP,
                    CategoryId: foundProduct.CategoryId,
                    BrandId: foundProduct.BrandId,
                    QuarterIds: editingQuarterIds,
                    ImageUrls: foundProduct.ImageUrls
                });
            }

            // 1. Update existing variants (using Bulk Endpoint for performance)
            const bulkItems = [];

            // 1. Prepare Bulk Update
            let lotId = null;

            if (isExistingLotMode) {
                // Create a Lot Record first for tracking
                try {
                    const lotRes = await api.post('/ProductLot/existing', {
                        ProductId: foundProduct.Id,
                        LotQuantity: existingLotQuantity
                    });
                    lotId = lotRes.data.LotId;
                } catch (e) {
                    console.error("Failed to create lot record", e);
                    // Proceed anyway? Or stop? Let's stop to ensure traceability.
                    alert(t.inventory.failedToInitLot);
                    return;
                }

                // Bulk update ALL variants with the lot quantity
                if (foundProduct.Variants) {
                    for (const variant of foundProduct.Variants) {
                        bulkItems.push({
                            VariantId: variant.Id,
                            Quantity: existingLotQuantity,
                            InventoryId: 1
                        });
                    }
                }
            } else {
                // Manual Mode - process specific updates
                for (const [variantIdStr, qty] of updates) {
                    bulkItems.push({
                        VariantId: parseInt(variantIdStr),
                        Quantity: qty,
                        InventoryId: 1
                    });
                }
            }

            if (bulkItems.length > 0) {
                // Pass LotId if available
                await api.post('/ProductVariants/stock/bulk', { Items: bulkItems, LotId: lotId });
            }

            // 2. Create new variants / Handle buffered new variants
            // Note: New variants must be created individually as they don't have IDs yet
            if (isExistingLotMode) {
                // Also handle any new variants in the buffer for Lot Mode
                for (const v of newVariantsToCreate) {
                    await api.post('/ProductVariants', {
                        ProductId: foundProduct.Id,
                        ProductColorId: v.colorId,
                        ProductSizeId: v.sizeId,
                        VariantPrice: foundProduct.BasePrice,
                        Quantity: existingLotQuantity, // Override with Lot Qty
                        DefaultInventoryId: 1
                    });
                }
            } else {
                // Manual Mode - Create new variants
                for (const v of newVariantsToCreate) {
                    await api.post('/ProductVariants', {
                        ProductId: foundProduct.Id,
                        ProductColorId: v.colorId,
                        ProductSizeId: v.sizeId,
                        VariantPrice: foundProduct.BasePrice,
                        Quantity: v.quantity,
                        DefaultInventoryId: 1
                    });
                }
            }

            alert(t.inventory.updatesSaved);
            setAddStockQuantities({});
            setNewVariantsToCreate([]);
            await handleSearch(searchQuery, true);
        } catch (err) {
            console.error(err);
            alert(t.inventory.failedToSaveUpdates);
        } finally {
            setIsSaving(false);
        }
    };


    useEffect(() => {
        loadMetadata();

        // Auto-fill from query param
        const params = new URLSearchParams(location.search);
        const pid = params.get('productId');
        if (pid) {
            handleSearch(pid);
            // Optionally clear the query param so refresh doesn't stick? 
            // Better to keep it for shared links.
            setSearchQuery(pid); // Update UI search box too
        }
    }, [location.search]);

    const loadMetadata = async () => {
        try {
            const [catRes, brandRes, quarterRes, colorRes] = await Promise.all([
                api.get('/Category'),
                api.get('/Brand'),
                api.get('/Quarter'),
                api.get('/ProductVariantColors')
            ]);
            setCategories(catRes.data.map((c: any) => ({ id: c.Id, name: c.Name })));
            setBrands(brandRes.data.map((b: any) => ({ Id: b.Id, Name: b.Name, Categories: b.Categories })));
            setQuarters(quarterRes.data.map((q: any) => ({ Id: q.Id, Name: q.Name })));
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

    const reorderImages = (newOrder: string[]) => {
        setSelectedImages(newOrder);
    };

    const addStock = () => {
        if (!newStock.color || !newStock.size || newStock.quantity < 0) return;
        const exists = stockItems.find(s => s.color === newStock.color && s.size === newStock.size);
        if (exists) {
            setStockItems(stockItems.map(s => s === exists ? { ...s, quantity: s.quantity + newStock.quantity } : s));
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
            alert(t.inventory.fillRequired);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Name', currentProduct.Name);
            formData.append('Description', currentProduct.Description || '');
            formData.append('BasePrice', currentProduct.BasePrice?.toString() || '0');
            formData.append('CategoryId', currentProduct.CategoryId.toString());
            formData.append('BrandId', currentProduct.BrandId.toString());
            if (currentProduct.QuarterIds && currentProduct.QuarterIds.length > 0) {
                currentProduct.QuarterIds.forEach((id: number) => {
                    formData.append('QuarterIds', id.toString());
                });
            }

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

            alert(t.inventory.productCreated);
            navigate('/products');

        } catch (e) {
            console.error(e);
            alert(t.inventory.failedToCreateProduct);
        }
    };

    const createLot = async () => {
        if (!currentProduct.Name || !currentProduct.CategoryId || lotQuantity <= 0) {
            alert(t.inventory.fillRequiredAndLot);
            return;
        }

        try {
            const formData = new FormData();
            formData.append('Name', currentProduct.Name);
            formData.append('Description', currentProduct.Description || '');
            formData.append('BasePrice', currentProduct.BasePrice?.toString() || '0');
            formData.append('CostPrice', currentProduct.CostPrice?.toString() || '0');
            formData.append('MSRP', currentProduct.MSRP?.toString() || '0');
            formData.append('CategoryId', currentProduct.CategoryId.toString());
            formData.append('BrandId', currentProduct.BrandId.toString());
            if (currentProduct.QuarterIds && currentProduct.QuarterIds.length > 0) {
                currentProduct.QuarterIds.forEach((id: number) => {
                    formData.append('QuarterIds', id.toString());
                });
            }
            formData.append('LotQuantity', lotQuantity.toString());

            stockItems.forEach((s, index) => {
                const colorId = colors.find(c => c.name === s.color)?.id;
                const sizeId = availableSizes.find(sz => sz.name === s.size)?.id;
                if (colorId && sizeId) {
                    formData.append(`Variants[${index}].ColorId`, colorId.toString());
                    formData.append(`Variants[${index}].SizeId`, sizeId.toString());
                }
            });

            imageFiles.forEach(file => formData.append('Images', file));

            await api.post('/ProductLot', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            alert(t.inventory.lotCreated);
            navigate('/products');

        } catch (e) {
            console.error(e);
            alert(t.inventory.failedToCreateLot);
        }
    };

    const [newVariant, setNewVariant] = useState({ colorId: 0, sizeId: 0, quantity: 1 });

    const addVariantToCreate = () => {
        if (!foundProduct || !newVariant.colorId || !newVariant.sizeId) {
            alert(t.inventory.selectColorAndSize);
            return;
        }

        const color = colors.find(c => c.id === newVariant.colorId);
        const size = availableSizes.find(s => s.id === newVariant.sizeId);

        // Check if already in foundProduct or in buffer
        const existsInProduct = foundProduct.Variants?.find((v: any) => v.ProductColorId === newVariant.colorId && v.ProductSizeId === newVariant.sizeId);
        const existsInBuffer = newVariantsToCreate.find(v => v.colorId === newVariant.colorId && v.sizeId === newVariant.sizeId);

        if (existsInBuffer) {
            setNewVariantsToCreate(prev => prev.map(v => 
                v.colorId === newVariant.colorId && v.sizeId === newVariant.sizeId 
                    ? { ...v, quantity: v.quantity + newVariant.quantity } 
                    : v
            ));
        } else if (existsInProduct) {
            setAddStockQuantities(prev => ({
                ...prev,
                [existsInProduct.Id]: (prev[existsInProduct.Id] || 0) + newVariant.quantity
            }));
        } else {
            setNewVariantsToCreate(prev => [...prev, {
                ...newVariant,
                colorName: color?.name,
                sizeName: size?.name
            }]);
        }
        setNewVariant({ colorId: 0, sizeId: 0, quantity: 1 });
    };

    const removeNewVariant = (index: number) => {
        setNewVariantsToCreate(prev => prev.filter((_, i) => i !== index));
    };

    const getColorHex = (name: string) => colors.find(c => c.name === name)?.hex || null;

    return (
        <div className="flex-1 flex flex-col h-full overflow-y-auto relative bg-[#f6f8f6] dark:bg-transparent">
            {/* Background blobs */}
            <div className="absolute blob bg-emerald-200/30 dark:bg-emerald-800/20 w-[500px] h-[500px] bottom-0 right-0 translate-x-1/4 translate-y-1/4 pointer-events-none"></div>

            <div className="container mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6 relative z-10">
                

                {/* Title */}
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h1 className="text-2xl md:text-3xl font-extrabold text-[#0e1b12] dark:text-white tracking-tight flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-3xl">input</span>
                            {t.inventory.stockManagement || 'Stock Management'}
                        </h1>
                        <p className="text-secondary dark:text-gray-400 text-sm max-w-xl">
                            {t.inventory.stockInSubtitle || 'Register new incoming shipments. You can add stock to existing items or create entirely new product listings.'}
                        </p>
                    </div>
                </div>

                {/* Main Panel */}
                <div className="bg-white/70 dark:bg-[var(--color-surface-dark-card)] backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col">
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200/50 dark:border-white/10">
                        <button
                            onClick={() => setActiveTab('existing')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'existing'
                                    ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10 font-bold'
                                    : 'text-gray-500 hover:text-primary hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">search</span>
                            {t.inventory.existingProduct || 'Existing Product'}
                        </button>
                        <button
                            onClick={() => setActiveTab('new')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'new'
                                    ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10 font-bold'
                                    : 'text-gray-500 hover:text-primary hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">add_circle</span>
                            {t.inventory.newProduct || 'New Product'}
                        </button>
                        <button
                            onClick={() => setActiveTab('lot')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'lot'
                                    ? 'text-primary border-b-2 border-primary bg-primary/5 dark:bg-primary/10 font-bold'
                                    : 'text-gray-500 hover:text-primary hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">dataset</span>
                            {t.inventory.customLot || 'Custom Lot'}
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {activeTab === 'existing' && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                {/* Search Section */}
                                <div className="flex flex-col gap-4 relative">
                                    <div className="flex gap-2 w-full">
                                        <div className="relative w-full">
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                                className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-lg rounded-xl focus:ring-primary focus:border-primary block w-full pl-12 pr-28 p-4 placeholder-gray-400 shadow-sm transition-all"
                                                placeholder={t.inventory.scanPlaceholder || "Scan item code (PV-...) or Enter Product ID..."}
                                                autoFocus
                                            />
                                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                                <button
                                                    onClick={() => setShowScanner(true)}
                                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                                                    {t.common.scan || 'Scan'}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSearch(searchQuery)}
                                            className="px-6 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-colors shrink-0"
                                        >
                                            {t.common.search || 'Search'}
                                        </button>
                                    </div>
                                </div>


                                {loadingProduct && <div className="text-center py-10 font-bold text-gray-400">{t.inventory.loadingProduct || 'Loading Product...'}</div>}

                                {foundProduct && (
                                    <div className="bg-white dark:bg-[var(--color-surface-dark-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--color-surface-dark-border)] p-6 animate-fadeIn relative overflow-hidden">
                                        {/* Progress Bar Overlay */}
                                        {isSaving && (
                                            <>
                                                <style>{`
                                                    @keyframes progress-slide {
                                                        0% { transform: translateX(-100%); }
                                                        100% { transform: translateX(400%); }
                                                    }
                                                `}</style>
                                                <div className="absolute top-0 left-0 w-full h-1 bg-gray-100 dark:bg-gray-700 z-20">
                                                    <div
                                                        className="h-full bg-primary w-1/3"
                                                        style={{ animation: 'progress-slide 1s infinite linear' }}
                                                    ></div>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-text-main dark:text-white">{foundProduct.Name}</h2>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {foundProduct.Category?.Name} · {foundProduct.Brand?.Name}
                                                </p>

                                                {/* Quarters Editing */}
                                                <div className="mt-2 flex flex-wrap gap-2 items-center">
                                                    <span className="text-xs font-bold uppercase text-gray-400 mr-2">{t.inventory.quarters || 'Quarters'}:</span>
                                                    {quarters.map((q: any) => {
                                                        const isSelected = editingQuarterIds.includes(q.Id);
                                                        return (
                                                            <button
                                                                key={q.Id}
                                                                onClick={() => {
                                                                    if (isSelected) setEditingQuarterIds(prev => prev.filter(id => id !== q.Id));
                                                                    else setEditingQuarterIds(prev => [...prev, q.Id]);
                                                                }}
                                                                className={`px-2 py-0.5 rounded textxs font-bold transition-colors shadow-sm ${isSelected
                                                                    ? 'bg-primary text-white border border-primary'
                                                                    : 'bg-white dark:bg-black/20 text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-primary hover:text-primary'
                                                                    }`}
                                                            >
                                                                {q.Name}
                                                            </button>
                                                        )
                                                    })}
                                                </div>

                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-xs uppercase font-bold text-gray-400">{t.inventory.totalStock || 'Total Stock'}</p>
                                                    <p className="text-2xl font-black text-primary">{foundProduct.TotalQuantity}</p>
                                                </div>

                                                {/* Toggle Mode */}
                                                <div className="flex items-center bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setIsExistingLotMode(false)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isExistingLotMode ? 'bg-white dark:bg-gray-800 shadow text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                    >
                                                        {t.inventory.manual || 'Manual'}
                                                    </button>
                                                    <button
                                                        onClick={() => setIsExistingLotMode(true)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isExistingLotMode ? 'bg-white dark:bg-gray-800 shadow text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                                    >
                                                        {t.inventory.byLot || 'By Lot'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isExistingLotMode && (
                                            <div className="mb-6 bg-primary/10 dark:bg-primary/20 rounded-xl p-4 border border-primary/20 flex items-center gap-4">
                                                <div className="w-32">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500 dark:text-gray-400">{t.inventory.lotQuantity || 'Lot Quantity'}</label>
                                                    <QuantityInput
                                                        value={existingLotQuantity}
                                                        onChange={setExistingLotQuantity}
                                                        min={0}
                                                    />
                                                </div>
                                                <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                                    {t.inventory.lotDescription || 'Enter the Lot Quantity to add to ALL variants below.'}
                                                </div>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3 rounded-l-lg">{t.inventory.variant || 'Variant'}</th>
                                                        <th className="px-4 py-3 text-center">{t.inventory.currentStock || 'Current Stock'}</th>
                                                        <th className="px-4 py-3 text-center">{t.inventory.defects || 'Defects'}</th>
                                                        <th className="px-4 py-3 text-center rounded-r-lg w-48">
                                                            {isExistingLotMode ? (t.inventory.resultingAdd || 'Resulting Add') : (t.inventory.addStock || 'Add Stock')}
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                                    {foundProduct.Variants?.map(variant => (
                                                        <tr key={variant.Id}>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    {variant.Color && (
                                                                        <span className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: variant.Color.HexCode }} title={variant.Color.Name}></span>
                                                                    )}
                                                                    <span className="font-bold text-text-main dark:text-white">
                                                                        {variant.Size?.Name}
                                                                        {variant.Color && <span className="font-normal text-gray-400 ml-1">({variant.Color.Name})</span>}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono font-bold dark:text-white">{variant.Quantity}</td>
                                                            <td className="px-4 py-3 text-center text-red-400">{variant.Defects}</td>
                                                            <td className="px-4 py-3 text-center rounded-r-lg w-48">
                                                                <div className="flex items-center gap-2">
                                                                    {isExistingLotMode ? (
                                                                        <div className="w-full bg-primary/10 border border-primary/20 rounded-lg px-3 py-1.5 text-center font-bold text-primary">
                                                                            +{existingLotQuantity}
                                                                        </div>
                                                                    ) : (
                                                                        <QuantityInput
                                                                            value={addStockQuantities[variant.Id] || 0}
                                                                            onChange={(val) => handleAddStockChange(variant.Id, val.toString())}
                                                                            min={0}
                                                                            className="w-full"
                                                                        />
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                    {/* Buffered New Variants */}
                                                    {newVariantsToCreate.map((v, idx) => (
                                                        <tr key={`new-${idx}`} className="bg-green-50/50 dark:bg-green-900/10">
                                                            <td className="px-4 py-3 font-bold text-text-main dark:text-white">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-4 h-4 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colors.find(c => c.id === v.colorId)?.hex || '#ccc' }}></span>
                                                                    {v.sizeName} ({v.colorName})
                                                                    <span className="ml-2 text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-black uppercase">{t.inventory.pending || 'Pending'}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono text-gray-400">-</td>
                                                            <td className="px-4 py-3 text-center text-gray-400">-</td>
                                                            <td className="px-4 py-3 flex items-center gap-2">
                                                                <div className="flex-1 text-center font-black text-primary text-lg">
                                                                    +{isExistingLotMode ? existingLotQuantity : v.quantity}
                                                                </div>
                                                                <button
                                                                    onClick={() => removeNewVariant(idx)}
                                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                                >
                                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="mt-6 flex justify-end">
                                            <button
                                                onClick={submitAddStock}
                                                className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">add_box</span>
                                                {t.inventory.updateStock || 'Update Stock'}
                                            </button>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                                            <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white mb-4">{t.inventory.addNewVariant || 'Add New Variant'}</h3>
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 flex flex-col md:flex-row gap-4 items-end">
                                                <div className="flex-1 w-full">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500 dark:text-gray-400">{t.common.color || 'Color'}</label>
                                                    <select
                                                        value={newVariant.colorId}
                                                        onChange={(e) => setNewVariant({ ...newVariant, colorId: Number(e.target.value) })}
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white"
                                                    >
                                                        <option value={0}>{t.common.selectColor || 'Select Color'}</option>
                                                        {colors.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500 dark:text-gray-400">{t.common.size || 'Size'}</label>
                                                    <select
                                                        value={newVariant.sizeId}
                                                        onChange={(e) => setNewVariant({ ...newVariant, sizeId: Number(e.target.value) })}
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary dark:text-white"
                                                    >
                                                        <option value={0}>{t.common.selectSize || 'Select Size'}</option>
                                                        {availableSizes.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500 dark:text-gray-400">{t.common.quantity || 'Quantity'}</label>
                                                    <QuantityInput
                                                        value={newVariant.quantity}
                                                        onChange={(val) => setNewVariant({ ...newVariant, quantity: val })}
                                                        min={1}
                                                    />
                                                </div>
                                                <button
                                                    onClick={addVariantToCreate}
                                                    className="w-full md:w-auto px-6 py-2 bg-[#4e9767] hover:bg-[#3d7a52] text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 h-[38px]"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                                                    {t.inventory.addToList || 'Add to List'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Recent / Empty State - Show only if no product found */}
                                {!foundProduct && !loadingProduct && (
                                    <div className="flex flex-col items-center justify-center py-12 text-center gap-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-white/5">
                                        <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="material-symbols-outlined text-3xl text-gray-400">qr_code_scanner</span>
                                        </div>
                                        <div className="max-w-xs">
                                            <h3 className="text-base font-bold text-[#0e1b12] dark:text-white">{t.inventory.readyToScan || 'Ready to Scan'}</h3>
                                            <p className="text-sm text-secondary dark:text-gray-400 mt-1">
                                                {t.inventory.scanSKUDescription || 'Scan a product barcode or enter a SKU to register new stock.'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {showScanner && (
                                    <BarcodeScanner
                                        enabled={true}
                                        onScanned={handleScan}
                                        onClose={() => setShowScanner(false)}
                                    />
                                )}
                            </div>
                        )}
                        {activeTab === 'new' && (
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                <ProductForm
                                    product={currentProduct}
                                    categories={categories}
                                    brands={brands}
                                    quarters={quarters}
                                    colors={colors}
                                    availableSizes={availableSizes}
                                    stockItems={stockItems}
                                    selectedImages={selectedImages}
                                    onChange={handleProductChange}
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
                                        {t.common.cancel || 'Cancel'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={createProduct}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        disabled={stockItems.length === 0}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        {t.inventory.saveProductAndStock || 'Save Product & Stock'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'lot' && (
                            // Custom Lot Form
                            <div className="flex flex-col gap-8 animate-fadeIn">
                                <ProductForm
                                    product={currentProduct}
                                    categories={categories}
                                    brands={brands}
                                    quarters={quarters}
                                    colors={colors}
                                    availableSizes={availableSizes}
                                    stockItems={stockItems}
                                    selectedImages={selectedImages}
                                    onChange={handleProductChange}
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
                                    cancelStockEdit={() => setEditingStockIndex(null)}
                                    startStockEdit={startStockEdit}
                                    getColorHex={getColorHex}
                                    isLotMode={true}
                                />

                                <div className="border-t border-gray-200/50 dark:border-white/10 pt-6">
                                    <div className="bg-primary/10 dark:bg-primary/20 rounded-xl p-6 border border-primary/20">
                                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-primary">layers</span>
                                            {t.inventory.lotConfiguration || 'Lot Configuration'}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                            {t.inventory.lotConfigDescription || 'Define the total quantity for this lot. This quantity will be applied to each variant defined above.'}
                                            <br />
                                            <span className="text-xs opacity-75">{t.inventory.lotExample || 'Example: 2 Variants x Lot Quantity 10 = 20 Total Items generated.'}</span>
                                        </p>

                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="w-full md:w-48">
                                                <label className="text-xs font-bold mb-1 block uppercase text-gray-500 dark:text-gray-400">{t.inventory.lotQuantity || 'Lot Quantity'}</label>
                                                <QuantityInput
                                                    value={lotQuantity}
                                                    onChange={setLotQuantity}
                                                    min={0}
                                                    className="text-lg"
                                                />
                                            </div>
                                            <div className="flex-1 text-sm text-secondary font-bold pb-3">
                                                {t.inventory.totalItemsToGenerate || 'Total Items to Generate'}: <span className="text-xl ml-1 text-[#0e1b12] dark:text-white">{lotQuantity * stockItems.length}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/inventory')}
                                        className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        {t.common.cancel || 'Cancel'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={createLot}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-primary hover:bg-primary-dark rounded-lg shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        disabled={stockItems.length === 0 || lotQuantity <= 0}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        {t.inventory.createCustomLot || 'Create Custom Lot'}
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
