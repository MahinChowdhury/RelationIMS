import { useState, useEffect } from 'react';
import { ProductForm } from '../../components/products/ProductForm';
import BarcodeScanner from '../../components/BarcodeScanner';
import type { Product, StockItem } from '../../types';
import api from '../../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export default function StockIn() {
    const navigate = useNavigate();
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

    // Existing Product State
    const [foundProduct, setFoundProduct] = useState<Product | null>(null);
    const [loadingProduct, setLoadingProduct] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [addStockQuantities, setAddStockQuantities] = useState<{ [variantId: number]: number }>({});

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
                        alert("Product not found with this code.");
                        setLoadingProduct(false);
                        return;
                    }
                }
            }

            // 2. Load Full Product Details
            const productRes = await api.get<Product>(`/Product/${productId}`);
            setFoundProduct(productRes.data);

            // 3. Load Available Sizes for this Product's Category
            if (productRes.data.CategoryId) {
                onCategoryChange(productRes.data.CategoryId);
            }

        } catch (err) {
            console.error(err);
            if (!isUpdate) alert("Failed to load product details.");
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
            alert("No changes to save.");
            return;
        }

        if (isExistingLotMode && existingLotQuantity <= 0) {
            alert("Please enter a valid lot quantity.");
            return;
        }

        try {
            setIsSaving(true);

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
                    alert("Failed to initialize Lot. Please try again.");
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

            alert("Updates saved successfully!");
            setAddStockQuantities({});
            setNewVariantsToCreate([]);
            await handleSearch(searchQuery, true);
        } catch (err) {
            console.error(err);
            alert("Failed to save updates.");
        } finally {
            setIsSaving(false);
        }
    };

    const location = useLocation();

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

    const createLot = async () => {
        if (!currentProduct.Name || !currentProduct.CategoryId || lotQuantity <= 0) {
            alert('Please fill in required fields and enter a valid Lot Quantity');
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

            alert('Lot created successfully!');
            navigate('/products');

        } catch (e) {
            console.error(e);
            alert('Failed to create lot');
        }
    };

    const [newVariant, setNewVariant] = useState({ colorId: 0, sizeId: 0, quantity: 1 });

    const addVariantToCreate = () => {
        if (!foundProduct || !newVariant.colorId || !newVariant.sizeId) {
            alert("Please select both color and size.");
            return;
        }

        const color = colors.find(c => c.id === newVariant.colorId);
        const size = availableSizes.find(s => s.id === newVariant.sizeId);

        // Check if already in foundProduct or in buffer
        const existsInProduct = foundProduct.Variants?.find((v: any) => v.ProductColorId === newVariant.colorId && v.ProductSizeId === newVariant.sizeId);
        const existsInBuffer = newVariantsToCreate.find(v => v.colorId === newVariant.colorId && v.sizeId === newVariant.sizeId);

        if (existsInProduct || existsInBuffer) {
            alert("This variant already exists or is already added to the list.");
            return;
        }

        setNewVariantsToCreate(prev => [...prev, {
            ...newVariant,
            colorName: color?.name,
            sizeName: size?.name
        }]);
        setNewVariant({ colorId: 0, sizeId: 0, quantity: 1 });
    };

    const removeNewVariant = (index: number) => {
        setNewVariantsToCreate(prev => prev.filter((_, i) => i !== index));
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
                        <button
                            onClick={() => setActiveTab('lot')}
                            className={`flex-1 py-4 text-sm font-medium transition-all flex justify-center items-center gap-2
                                ${activeTab === 'lot'
                                    ? 'text-[#17cf54] border-b-2 border-[#17cf54] bg-[#17cf54]/5 dark:bg-[#17cf54]/10 font-bold'
                                    : 'text-gray-500 hover:text-[#17cf54] hover:bg-gray-50/50 dark:text-gray-400 dark:hover:text-white'}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">dataset</span>
                            Custom Lot
                        </button>
                    </div>

                    <div className="p-6 md:p-8">
                        {activeTab === 'existing' && (
                            <div className="flex flex-col gap-6 animate-fadeIn">
                                {/* Search Section */}
                                <div className="flex flex-col gap-4 relative">
                                    <div className="flex gap-2 w-full">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                                            className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 text-[#0e1b12] dark:text-white text-lg rounded-xl focus:ring-[#17cf54] focus:border-[#17cf54] block w-full pl-12 p-4 placeholder-gray-400 shadow-sm transition-all"
                                            placeholder="Scan item code (PV-...) or Enter Product ID..."
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleSearch(searchQuery)}
                                            className="px-6 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-xl font-bold transition-colors"
                                        >
                                            Search
                                        </button>
                                    </div>
                                    <div className="absolute right-0 top-0 h-full flex items-center pr-2">
                                        <button
                                            onClick={() => setShowScanner(true)}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 text-gray-700 dark:text-gray-300 mr-28 mt-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">barcode_scanner</span>
                                        </button>
                                    </div>
                                </div>


                                {loadingProduct && <div className="text-center py-10 font-bold text-gray-400">Loading Product...</div>}

                                {foundProduct && (
                                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6 animate-fadeIn relative overflow-hidden">
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
                                                        className="h-full bg-[#17cf54] w-1/3"
                                                        style={{ animation: 'progress-slide 1s infinite linear' }}
                                                    ></div>
                                                </div>
                                            </>
                                        )}
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h2 className="text-2xl font-bold text-text-main dark:text-white">{foundProduct.Name}</h2>
                                                <p className="text-sm text-gray-500">{foundProduct.Category?.Name} • {foundProduct.Brand?.Name}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <div className="text-right">
                                                    <p className="text-xs uppercase font-bold text-gray-400">Total Stock</p>
                                                    <p className="text-2xl font-black text-[#17cf54]">{foundProduct.TotalQuantity}</p>
                                                </div>

                                                {/* Toggle Mode */}
                                                <div className="flex items-center bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
                                                    <button
                                                        onClick={() => setIsExistingLotMode(false)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${!isExistingLotMode ? 'bg-white shadow text-[#17cf54]' : 'text-gray-400'}`}
                                                    >
                                                        Manual
                                                    </button>
                                                    <button
                                                        onClick={() => setIsExistingLotMode(true)}
                                                        className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${isExistingLotMode ? 'bg-white shadow text-[#17cf54]' : 'text-gray-400'}`}
                                                    >
                                                        By Lot
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {isExistingLotMode && (
                                            <div className="mb-6 bg-[#17cf54]/10 dark:bg-[#17cf54]/20 rounded-xl p-4 border border-[#17cf54]/20 flex items-center gap-4">
                                                <div className="w-32">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Lot Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={existingLotQuantity}
                                                        onChange={(e) => setExistingLotQuantity(parseInt(e.target.value) || 0)}
                                                        className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-lg font-bold rounded-lg p-2 text-center focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                        placeholder="0"
                                                    />
                                                </div>
                                                <div className="flex-1 text-sm text-gray-600 dark:text-gray-300">
                                                    Enter the Lot Quantity to add to <strong>ALL</strong> variants below.
                                                </div>
                                            </div>
                                        )}

                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm text-left">
                                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 font-medium">
                                                    <tr>
                                                        <th className="px-4 py-3 rounded-l-lg">Variant</th>
                                                        <th className="px-4 py-3 text-center">Current Stock</th>
                                                        <th className="px-4 py-3 text-center">Defects</th>
                                                        <th className="px-4 py-3 text-center rounded-r-lg w-48">
                                                            {isExistingLotMode ? 'Resulting Add' : 'Add Stock'}
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
                                                            <td className="px-4 py-3 text-center font-mono font-bold">{variant.Quantity}</td>
                                                            <td className="px-4 py-3 text-center text-red-400">{variant.Defects}</td>
                                                            <td className="px-4 py-3 text-center rounded-r-lg w-48">
                                                                <div className="flex items-center gap-2">
                                                                    {isExistingLotMode ? (
                                                                        <div className="w-full bg-[#17cf54]/10 border border-[#17cf54]/20 rounded-lg px-3 py-1.5 text-center font-bold text-[#17cf54]">
                                                                            +{existingLotQuantity}
                                                                        </div>
                                                                    ) : (
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            className="w-full bg-[#f8fcf9] dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 text-center font-bold focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                                            placeholder="+0"
                                                                            value={addStockQuantities[variant.Id] || ''}
                                                                            onChange={(e) => handleAddStockChange(variant.Id, e.target.value)}
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
                                                                    <span className="ml-2 text-[10px] bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded font-black uppercase">Pending</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-mono text-gray-400">—</td>
                                                            <td className="px-4 py-3 text-center text-gray-400">—</td>
                                                            <td className="px-4 py-3 flex items-center gap-2">
                                                                <div className="flex-1 text-center font-black text-[#17cf54] text-lg">
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
                                                className="px-6 py-3 bg-[#17cf54] hover:bg-[#12a542] text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined">add_box</span>
                                                Update Stock
                                            </button>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/10">
                                            <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white mb-4">Add New Variant</h3>
                                            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 flex flex-col md:flex-row gap-4 items-end">
                                                <div className="flex-1 w-full">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Color</label>
                                                    <select
                                                        value={newVariant.colorId}
                                                        onChange={(e) => setNewVariant({ ...newVariant, colorId: Number(e.target.value) })}
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                    >
                                                        <option value={0}>Select Color</option>
                                                        {colors.map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Size</label>
                                                    <select
                                                        value={newVariant.sizeId}
                                                        onChange={(e) => setNewVariant({ ...newVariant, sizeId: Number(e.target.value) })}
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                    >
                                                        <option value={0}>Select Size</option>
                                                        {availableSizes.map(s => (
                                                            <option key={s.id} value={s.id}>{s.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="w-full md:w-32">
                                                    <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Quantity</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={newVariant.quantity}
                                                        onChange={(e) => setNewVariant({ ...newVariant, quantity: Number(e.target.value) })}
                                                        className="w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-bold text-center focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                    />
                                                </div>
                                                <button
                                                    onClick={addVariantToCreate}
                                                    className="w-full md:w-auto px-6 py-2 bg-[#4e9767] hover:bg-[#3d7a52] text-white rounded-lg font-bold transition-all flex items-center justify-center gap-2 h-[38px]"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">add_task</span>
                                                    Add to List
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
                                            <h3 className="text-base font-bold text-[#0e1b12] dark:text-white">Ready to Scan</h3>
                                            <p className="text-sm text-[#4e9767] dark:text-gray-400 mt-1">
                                                Scan a product barcode or enter a SKU to register new stock.
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

                        {activeTab === 'lot' && (
                            // Custom Lot Form
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
                                    isLotMode={true}
                                />

                                <div className="border-t border-gray-200/50 dark:border-white/10 pt-6">
                                    <div className="bg-[#17cf54]/10 dark:bg-[#17cf54]/20 rounded-xl p-6 border border-[#17cf54]/20">
                                        <h3 className="text-lg font-bold text-[#0e1b12] dark:text-white mb-2 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-[#17cf54]">layers</span>
                                            Lot Configuration
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                            Define the total quantity for this lot. This quantity will be applied to <strong>each</strong> variant defined above.
                                            <br />
                                            <span className="text-xs opacity-75">Example: 2 Variants x Lot Quantity 10 = 20 Total Items generated.</span>
                                        </p>

                                        <div className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="w-full md:w-48">
                                                <label className="text-xs font-bold mb-1 block uppercase text-gray-500">Lot Quantity</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={lotQuantity}
                                                    onChange={(e) => setLotQuantity(parseInt(e.target.value))}
                                                    className="w-full bg-white dark:bg-black/40 border border-gray-200 dark:border-gray-700 text-lg font-bold rounded-lg p-3 text-center focus:ring-[#17cf54] focus:border-[#17cf54]"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="flex-1 text-sm text-[#4e9767] font-bold pb-3">
                                                Total Items to Generate: <span className="text-xl ml-1 text-[#0e1b12] dark:text-white">{lotQuantity * stockItems.length}</span>
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
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={createLot}
                                        className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#17cf54] hover:bg-[#12a542] rounded-lg shadow-lg shadow-green-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        disabled={stockItems.length === 0 || lotQuantity <= 0}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">save</span>
                                        Create Custom Lot
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
