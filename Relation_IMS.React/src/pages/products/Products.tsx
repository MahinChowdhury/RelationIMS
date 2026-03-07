import { useState, useEffect } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import ProductCard from '../../components/products/ProductCard';
import { ProductFormModal, DeleteProductModal } from '../../components/products/ProductModals';
import BarcodeScanner from '../../components/BarcodeScanner';
import { BarcodeSheet } from '../../components/products/BarcodeSheet';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import type { Product, StockItem } from '../../types';
import axios from 'axios';

interface ProductsPageProps {
    isGuestView?: boolean;
    password?: string;
}

export default function ProductsPage({ isGuestView = false, password }: ProductsPageProps) {
    const navigate = useNavigate();
    const { hash } = useParams<{ hash: string }>();
    const { t } = useLanguage();

    // State
    const [products, setProducts] = useState<Product[]>([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true); // For infinite scroll

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 300);

    const [sortBy, setSortBy] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<string>('');
    const [selectedQuarter, setSelectedQuarter] = useState<string>('');
    const [stockOrder, setStockOrder] = useState('');

    // Grid Density
    const [gridDensity, setGridDensity] = useState<4 | 6 | 8>(() => {
        const saved = localStorage.getItem('productGridDensity');
        return saved ? (parseInt(saved) as 4 | 6 | 8) : 6;
    });

    // Dropdown Data
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
    const [quarters, setQuarters] = useState<any[]>([]);
    const [colors, setColors] = useState<any[]>([]);
    const [availableSizes, setAvailableSizes] = useState<any[]>([]);

    // Modals
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    const [scannerEnabled, setScannerEnabled] = useState(false);

    // Editing / Creating State
    const [productToDelete, setProductToDelete] = useState<number | null>(null);

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

    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [newStock, setNewStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });
    const [editingStockIndex, setEditingStockIndex] = useState<number | null>(null);
    const [editedStock, setEditedStock] = useState<StockItem>({ color: '', size: '', quantity: 0 });
    const [deletedVariantIds, setDeletedVariantIds] = useState<number[]>([]);

    // Images
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [imageMap, setImageMap] = useState<Record<string, File>>({});

    const placeholderImage = 'https://via.placeholder.com/80x80.png?text=No+Image';

    // Infinite Scroll Hook
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    // Initial Load
    useEffect(() => {
        loadCategories();
        loadBrands();
        loadQuarters();
        loadColors();
    }, []);

    // ONE Unified Filter Trigger
    useEffect(() => {
        loadProducts(true);
    }, [selectedCategory, selectedBrand, selectedQuarter, stockOrder, sortBy, debouncedSearch]);

    // Infinite Scroll Trigger
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            setPage(prev => prev + 1);
        }
    }, [isVisible]);

    useEffect(() => {
        if (page > 1) {
            loadProducts(false);
        }
    }, [page]);

    // --- Data Loading ---
    const loadProducts = async (reset: boolean) => {
        if (reset) {
            setProducts([]);
            setPage(1);
            setHasMore(true);
        }

        setLoading(true);
        try {
            const params = new URLSearchParams({
                search: debouncedSearch || '',
                sortBy: sortBy || '',
                stockOrder: stockOrder || '',
                categoryId: selectedCategory === '' ? '-1' : selectedCategory,
                BrandId: selectedBrand === '' ? '-1' : selectedBrand,
                QuarterId: selectedQuarter === '' ? '-1' : selectedQuarter,
                pageNumber: reset ? '1' : page.toString(),
                pageSize: '20',
            });

            let res;
            if (isGuestView && password) {
                params.append('password', password);
                res = await axios.get(`${API_BASE_URL}/ShareCatalog/${hash}?${params.toString()}`);
                if (res.data.products) {
                    res = { data: res.data.products };
                } else {
                    res = { data: [] };
                }
            } else {
                res = await api.get(`/Product?${params.toString()}`);
            }

            if (reset) {
                setProducts(res.data);
            } else {
                setProducts(prev => {
                    const newProducts = res.data.filter((p: Product) => !prev.some(existing => existing.Id === p.Id));
                    return [...prev, ...newProducts];
                });
            }

            if (res.data.length < 20) setHasMore(false);

        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await api.get('/Category');
            setCategories(res.data.map((cat: any) => ({ id: cat.Id, name: cat.Name })));
        } catch (err) { console.error(err); }
    };

    const loadBrands = async () => {
        try {
            const res = await api.get('/Brand');
            setBrands(res.data.map((b: any) => ({ Id: b.Id, Name: b.Name, Categories: b.Categories })));
        } catch (err) { console.error(err); }
    };

    const loadQuarters = async () => {
        try {
            const res = await api.get('/Quarter');
            setQuarters(res.data.map((q: any) => ({ Id: q.Id, Name: q.Name })));
        } catch (err) { console.error(err); }
    };

    const loadColors = async () => {
        try {
            const res = await api.get('/ProductVariantColors');
            setColors(res.data.map((c: any) => ({ id: c.Id, name: c.Name, hex: c.HexCode })));
        } catch (err) { console.error(err); }
    };

    const onCategoryChange = async (categoryId: number) => {
        try {
            const res = await api.get(`/ProductVariantSizes/category/${categoryId}`);
            setAvailableSizes(res.data.map((s: any) => ({ id: s.Id, name: s.Name })));
        } catch (err) {
            console.error(err);
            setAvailableSizes([]);
        }
    };

    // --- Helpers ---
    const getCategoryNameById = (id: number) => categories.find(c => c.id === id)?.name || 'Unknown';
    const getBrandName = (id: number) => brands.find(b => b.Id === id)?.Name || 'Unknown';
    const getQuarterName = (id: number) => quarters.find(q => q.Id === id)?.Name || 'Unknown';
    const getColorHex = (name: string) => colors.find(c => c.name === name)?.hex || null;
    const getStockStatus = (id: number) => {
        const p = products.find(prod => prod.Id === id);
        return (p?.TotalQuantity || 0) > 0;
    };

    // --- Modals --- (Keep all modal logic same)
    // OPEN EDIT
    const openEditModal = async (product: Product) => {
        setCurrentProduct({ ...product, CategoryId: product.CategoryId || product.Category?.Id || 0 });
        setSelectedImages(product.ImageUrls ? [...product.ImageUrls] : []);
        setImageMap({});
        setStockItems([]);
        setDeletedVariantIds([]);
        await onCategoryChange(Number(product.CategoryId)); // Load relevant sizes

        // Load Variants
        try {
            const res = await api.get(`/ProductVariants/product/${product.Id}`);
            const sizeRes = await api.get(`/ProductVariantSizes/category/${product.CategoryId}`);
            const sizes = sizeRes.data;
            setAvailableSizes(sizes.map((s: any) => ({ id: s.Id, name: s.Name })));

            const mappedStock = res.data.map((variant: any) => {
                const color = colors.find(c => c.id === variant.ProductColorId);
                const size = sizes.find((s: any) => s.Id === variant.ProductSizeId);
                return {
                    id: variant.Id,
                    color: color?.name || 'Unknown',
                    size: size?.Name || 'Unknown',
                    quantity: variant.Quantity
                };
            });
            setStockItems(mappedStock);
        } catch (err) {
            console.error("Failed variants", err);
        }
        setShowEditModal(true);
    };

    // SAVE EDIT
    const saveEdit = async () => {
        if (!currentProduct.Id) return;
        try {
            // 1. Upload new images in the correct order mapped by state
            const finalImageUrls: string[] = [];
            for (const img of selectedImages) {
                if (img.startsWith('http') && !img.startsWith('blob:')) {
                    finalImageUrls.push(img);
                } else if (imageMap[img]) {
                    const formData = new FormData();
                    formData.append('file', imageMap[img]);
                    const res = await api.post('/Blob/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    finalImageUrls.push(res.data);
                }
            }

            // 2. Delete removed variants
            for (const vId of deletedVariantIds) {
                await api.delete(`/ProductVariants/${vId}`).catch(e => console.error(e));
            }

            // 3. Update/Create variants
            for (const item of stockItems) {
                const colorId = colors.find(c => c.name === item.color)?.id;
                const sizeId = availableSizes.find(s => s.name === item.size)?.id;

                if (!colorId || !sizeId) continue;

                const payload = {
                    ProductId: currentProduct.Id,
                    ProductColorId: colorId,
                    ProductSizeId: sizeId,
                    VariantPrice: currentProduct.BasePrice,
                    CostPrice: currentProduct.CostPrice,
                    MSRP: currentProduct.MSRP,
                    Quantity: item.quantity
                };

                if (item.id && item.id !== 0) {
                    await api.put(`/ProductVariants/${item.id}`, { Id: item.id, ...payload }).catch(e => console.error(e));
                } else {
                    await api.post(`/ProductVariants`, { ...payload, DefaultInventoryId: 1 }).catch(e => console.error(e));
                }
            }

            // 4. Update Product
            await api.put(`/Product/${currentProduct.Id}`, {
                ...currentProduct,
                ImageUrls: finalImageUrls
            });

            setShowEditModal(false);
            loadProducts(true);

        } catch (e) {
            console.error(e);
            alert(t.products.failedToUpdate);
        }
    };

    // CREATE PRODUCT
    const openCreateModal = () => {
        setShowCreateModal(true);
        setCurrentProduct(initialProductState);
        setSelectedImages([]);
        setImageMap({});
        setStockItems([]);
        setNewStock({ color: '', size: '', quantity: 0 });
    };

    const createProduct = async () => {
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

            // Append images inside correctly ordered bounds
            selectedImages.forEach(img => {
                if (imageMap[img]) {
                    formData.append('Images', imageMap[img]);
                }
            });

            // Note: Product creation is now instant, images upload in background.
            const res = await api.post('/Product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            console.log('Product created response:', res.data);
            const productId = res.data.id || res.data.Id;
            console.log('Product ID:', productId, 'Stock items:', stockItems);

            // Add Variants (Keep existing logic as it uses a separate endpoint)
            if (productId && stockItems.length > 0) {
                for (const stock of stockItems) {
                    const colorId = colors.find(c => c.name === stock.color)?.id;
                    const sizeId = availableSizes.find(s => s.name === stock.size)?.id;

                    console.log('Adding variant:', { color: stock.color, size: stock.size, colorId, sizeId, quantity: stock.quantity });

                    if (colorId && sizeId) {
                        try {
                            const variantRes = await api.post('/ProductVariants', {
                                ProductId: productId,
                                ProductColorId: colorId,
                                ProductSizeId: sizeId,
                                VariantPrice: currentProduct.BasePrice,
                                CostPrice: currentProduct.CostPrice,
                                MSRP: currentProduct.MSRP,
                                Quantity: stock.quantity,
                                DefaultInventoryId: 1
                            });
                            console.log('Variant created:', variantRes.data);
                        } catch (variantErr) {
                            console.error('Failed to create variant:', variantErr);
                        }
                    } else {
                        console.warn('Color or Size not found:', { stock, colorId, sizeId });
                    }
                }
            }

            setShowCreateModal(false);
            setCurrentProduct(initialProductState);
            setSelectedImages([]);
            setImageMap({});
            setStockItems([]);
            setNewStock({ color: '', size: '', quantity: 0 });
            loadProducts(true);

        } catch (e) {
            console.error(e);
            alert(t.products.failedToCreate);
        }
    };

    // DELETE
    const deleteProduct = async () => {
        if (!productToDelete) return;
        try {
            await api.delete(`/Product/${productToDelete}`);
            setProducts(prev => prev.filter(p => p.Id !== productToDelete));
            setShowDeleteModal(false);
            setProductToDelete(null);
        } catch (e) {
            console.error(e);
            alert(t.products.failedToDelete);
        }
    };

    // --- Handlers for Form ---
    const handleProductChange = (field: string, value: any) => {
        setCurrentProduct(prev => ({ ...prev, [field]: value }));
    };

    const onImagesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newMap = { ...imageMap };
            const newUrls: string[] = [];
            files.forEach(file => {
                const url = URL.createObjectURL(file);
                newMap[url] = file;
                newUrls.push(url);
            });
            setImageMap(newMap);
            setSelectedImages(prev => [...prev, ...newUrls]);
        }
    };

    const removeImage = (img: string) => {
        setSelectedImages(prev => prev.filter(i => i !== img));
        if (imageMap[img]) {
            setImageMap(prev => {
                const newMap = { ...prev };
                delete newMap[img];
                return newMap;
            });
        }
    };

    const reorderImages = (newOrder: string[]) => {
        setSelectedImages(newOrder);
    };

    // Stock Handlers
    const addStock = () => {
        if (!newStock.color || !newStock.size || newStock.quantity < 0) return;
        const exists = stockItems.find(s => s.color === newStock.color && s.size === newStock.size);
        if (exists) {
            setStockItems(stockItems.map(s => s === exists ? { ...s, quantity: newStock.quantity } : s));
        } else {
            setStockItems([...stockItems, { ...newStock }]);
        }
        setNewStock({ color: '', size: '', quantity: 0 });
    };

    const removeStock = (index: number) => {
        const item = stockItems[index];
        if (item.id) setDeletedVariantIds(prev => [...prev, item.id!]);
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

    const onBarcodeScanned = (code: string) => {
        setShowBarcodeScanner(false);
        navigate(`/products/${code}`);
    };

    // Print Barcodes
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [itemsToPrint, setItemsToPrint] = useState<{ code: string; itemDetails: string }[]>([]);

    const handlePrintBarcodes = async (productId: number) => {
        try {
            const product = products.find(p => p.Id === productId);
            if (!product) return;

            const res = await api.get<Product>(`/Product/${productId}`);
            const fullProduct = res.data as any; // Cast to any to access nested Variants and ProductItems

            if (fullProduct.Variants) {
                const barcodes: { code: string; itemDetails: string }[] = [];
                fullProduct.Variants.forEach((variant: any) => {
                    const colorName = variant.Color?.Name || variant.ProductColorId.toString(); // Fallback if name not populated
                    const sizeName = variant.Size?.Name || variant.ProductSizeId.toString();

                    if (variant.ProductItems) {
                        variant.ProductItems.forEach((item: any) => {
                            if (!item.IsSold && !item.IsDefected) {
                                barcodes.push({
                                    code: item.Code,
                                    itemDetails: `Color: ${colorName}, Size: ${sizeName}`
                                });
                            }
                        });
                    }
                });
                setItemsToPrint(barcodes);
                setShowPrintModal(true);
            } else {
                alert(t.products.noVariantsFound);
            }

        } catch (error) {
            console.error('Failed to prepare barcodes:', error);
            alert(t.products.failedToLoadForPrinting);
        }
    };

    const printSheet = () => {
        window.print();
    };

    return (
        <div className="container mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6 flex flex-col gap-4">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    {isGuestView && hash ? (
                        <li aria-current="page">
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                                <span className="text-sm font-bold text-text-main md:ms-2 dark:text-white">{'Catalog'}</span>
                            </div>
                        </li>
                    ) : (
                        <>
                            <li className="inline-flex items-center">
                                <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                                    <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                                    {t.nav.dashboard}
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    <span className="ms-1 text-sm font-medium text-text-secondary md:ms-2 dark:text-gray-400 cursor-pointer">{t.nav.products}</span>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{t.products.allProducts}</span>
                                </div>
                            </li>
                        </>
                    )}
                </ol>
            </nav>

            {/* Print Modal Overlay (Using a simple full screen div for now to support @media print) */}
            {showPrintModal && (
                <div className="fixed inset-0 z-[9999] bg-white overflow-auto">
                    <div className="p-4 flex justify-between items-center bg-gray-100 border-b no-print sticky top-0">
                        <h2 className="text-xl font-bold">{t.products.printBarcodes}</h2>
                        <div className="flex gap-2">
                            <button
                                onClick={printSheet}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined">print</span> {t.common.print}
                            </button>
                            <button
                                onClick={() => setShowPrintModal(false)}
                                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 font-bold"
                            >
                                {t.common.close}
                            </button>
                        </div>
                    </div>
                    <div className="p-8">
                        {/* Dynamic Import or direct usage if imported at top */}
                        <BarcodeSheet items={itemsToPrint} />
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-primary text-white p-2 rounded-lg shadow-sm">
                        <span className="material-symbols-outlined text-[24px]">shopping_cart</span>
                    </div>
                    <h1 className="text-2xl font-extrabold text-text-main dark:text-white tracking-tight">
                        {isGuestView ? t.products.title : t.products.title}
                    </h1>
                </div>
                {!isGuestView && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => { setShowBarcodeScanner(true); setScannerEnabled(true); }}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gray-900 rounded-lg hover:bg-gray-800 dark:bg-black dark:border dark:border-gray-700 dark:hover:bg-gray-900 transition-all shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                            <span className="hidden sm:inline">{t.common.scan}</span>
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-lg hover:bg-primary-dark transition-all shadow-sm shadow-green-500/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            <span className="hidden sm:inline">{t.products.addProduct}</span>
                            <span className="sm:hidden">{t.common.add}</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col gap-3">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
                    </div>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full py-2.5 ps-10 text-sm text-text-main border border-gray-200 rounded-lg bg-white shadow-sm focus:ring-primary focus:border-primary dark:bg-[#1a2e22] dark:border-[#2a4032] dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary dark:focus:border-primary transition-all"
                        placeholder={t.products.searchProducts}
                    />
                </div>
                <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {/* Sort */}
                    <div className="relative">
                        <button className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md text-xs font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px]">sort</span>
                            {sortBy || t.products.sort}
                            <span className="material-symbols-outlined text-[14px] text-gray-400">expand_more</span>
                        </button>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="">{t.products.sortBy}</option>
                            <option value="SKU">{t.products.sku}</option>
                            <option value="Brand">{t.products.brand}</option>
                            <option value="Price Ascending">{t.products.priceAscending}</option>
                            <option value="Price Descending">{t.products.priceDescending}</option>
                        </select>
                    </div>

                    {/* Brand */}
                    <div className="relative">
                        <button className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md text-xs font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            {selectedBrand === '' ? t.products.brand : getBrandName(Number(selectedBrand))}
                        </button>
                        <select
                            value={selectedBrand}
                            onChange={(e) => setSelectedBrand(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="">{t.products.allBrands}</option>
                            {brands.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
                        </select>
                    </div>

                    {/* Category */}
                    <div className="relative">
                        <button className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md text-xs font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            {selectedCategory === '' ? t.products.category : getCategoryNameById(Number(selectedCategory))}
                        </button>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="">{t.products.allCategories}</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* Quarter */}
                    <div className="relative">
                        <button className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md text-xs font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            {selectedQuarter === '' ? t.products.quarter : getQuarterName(Number(selectedQuarter))}
                        </button>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="">{t.products.allQuarters}</option>
                            {quarters.map(q => <option key={q.Id} value={q.Id}>{q.Name}</option>)}
                        </select>
                    </div>

                    {/* Stock */}
                    <div className="relative">
                        <button className="shrink-0 px-3 py-1.5 bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md text-xs font-medium text-text-main dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                            {stockOrder || t.products.stockStatus}
                        </button>
                        <select
                            value={stockOrder}
                            onChange={(e) => setStockOrder(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        >
                            <option value="">{t.common.default}</option>
                            <option value="in-stock">in-stock</option>
                            <option value="low-stock">low-stock</option>
                            <option value="out-of-stock">out-of-stock</option>
                        </select>
                    </div>

                    {/* Grid Density Toggle */}
                    <div className="flex items-center bg-white dark:bg-[#1a2e22] border border-gray-200 dark:border-[#2a4032] rounded-md">
                        {[
                            { value: 4, icon: 'grid_view' },
                            { value: 6, icon: 'view_module' },
                            { value: 8, icon: 'dashboard' },
                        ].map(({ value, icon }) => (
                            <button
                                key={value}
                                onClick={() => {
                                    setGridDensity(value as 4 | 6 | 8);
                                    localStorage.setItem('productGridDensity', value.toString());
                                }}
                                className={`p-1 rounded transition-all ${gridDensity === value
                                    ? 'bg-[#4e9767] text-white'
                                    : 'text-gray-500 hover:text-[#4e9767] hover:bg-gray-100 dark:hover:bg-white/5'
                                    }`}
                                title={`${value} per row`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className={`grid gap-3 sm:gap-4 pb-6 ${gridDensity === 4 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4' :
                gridDensity === 6 ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6' :
                    'grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8'
                }`}>
                {products.map(product => (
                    <div key={product.Id} className="relative group">
                        <ProductCard
                            product={product}
                            placeholderImage={placeholderImage}
                            getStockStatus={getStockStatus}
                            getCategoryNameById={(id) => getCategoryNameById(Number(id))}
                            getBrandName={(id) => getBrandName(Number(id))}
                            gridDensity={gridDensity}
                            onEdit={isGuestView ? undefined : openEditModal}
                            onDelete={isGuestView ? undefined : ((id: number) => { setProductToDelete(id); setShowDeleteModal(true); })}
                            onCardClick={isGuestView && hash ? (id) => navigate(`/products/share-catalog/${hash}/${id}`) : undefined}
                            isGuestView={isGuestView}
                        />
                        {/* Print Button Overlay on Card */}
                        {!isGuestView && (
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrintBarcodes(product.Id); }}
                                    className="p-1.5 bg-white text-gray-700 rounded-full shadow-md hover:bg-gray-100 hover:text-blue-600"
                                    title="Print Barcodes"
                                >
                                    <span className="material-symbols-outlined text-[20px]">print</span>
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Infinite Scroll Anchor */}
            <div ref={containerRef} className="flex flex-col items-center justify-center py-4">
                {loading && (
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                )}
            </div>

            {/* MODALS */}
            {showBarcodeScanner && (
                <BarcodeScanner
                    enabled={scannerEnabled}
                    onScanned={onBarcodeScanned}
                    onClose={() => { setShowBarcodeScanner(false); setScannerEnabled(false); }}
                />
            )}

            <DeleteProductModal
                show={showDeleteModal}
                onCancel={() => setShowDeleteModal(false)}
                onConfirm={deleteProduct}
            />

            <ProductFormModal
                show={showCreateModal}
                mode="create"
                product={currentProduct}
                categories={categories}
                brands={brands}
                quarters={quarters}
                colors={colors}
                availableSizes={availableSizes}
                stockItems={stockItems}
                selectedImages={selectedImages}
                onClose={() => setShowCreateModal(false)}
                onSave={createProduct}
                onChange={handleProductChange}
                onCategoryChange={onCategoryChange}
                onImagesSelected={onImagesSelected}
                removeImage={removeImage}
                reorderImages={reorderImages}
                newStock={newStock}
                setNewStock={setNewStock}
                addStock={addStock}
                removeStock={removeStock}
                saveStockEdit={saveStockEdit}
                cancelStockEdit={() => setEditingStockIndex(null)}
                startStockEdit={startStockEdit}
                editingStockIndex={editingStockIndex}
                editedStock={editedStock}
                setEditedStock={setEditedStock}
                getColorHex={getColorHex}
            />

            <ProductFormModal
                show={showEditModal}
                mode="edit"
                product={currentProduct}
                categories={categories}
                brands={brands}
                quarters={quarters}
                colors={colors}
                availableSizes={availableSizes}
                stockItems={stockItems}
                selectedImages={selectedImages}
                onClose={() => setShowEditModal(false)}
                onSave={saveEdit}
                onChange={handleProductChange}
                onCategoryChange={onCategoryChange}
                onImagesSelected={onImagesSelected}
                removeImage={removeImage}
                reorderImages={reorderImages}
                newStock={newStock}
                setNewStock={setNewStock}
                addStock={addStock}
                removeStock={removeStock}
                saveStockEdit={saveStockEdit}
                cancelStockEdit={() => setEditingStockIndex(null)}
                startStockEdit={startStockEdit}
                editingStockIndex={editingStockIndex}
                editedStock={editedStock}
                setEditedStock={setEditedStock}
                getColorHex={getColorHex}
            />
        </div>
    );
}
