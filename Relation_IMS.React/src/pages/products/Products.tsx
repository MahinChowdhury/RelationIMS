import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import ProductCard from '../../components/products/ProductCard';
import { ProductFormModal, DeleteProductModal } from '../../components/products/ProductModals';
import BarcodeScanner from '../../components/BarcodeScanner';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';
import useDebounce from '../../hooks/useDebounce';
import type { Product, StockItem } from '../../types';

export default function ProductsPage() {
    const navigate = useNavigate();
    // const { id } = useParams(); // For deep linking via barcode or url

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
    const [stockOrder, setStockOrder] = useState('');

    // Dropdown Data
    const [categories, setCategories] = useState<any[]>([]);
    const [brands, setBrands] = useState<any[]>([]);
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
        CategoryId: 0,
        BrandId: 0,
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
    const [imageFiles, setImageFiles] = useState<File[]>([]);

    const placeholderImage = 'https://via.placeholder.com/80x80.png?text=No+Image';

    // Infinite Scroll Hook
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    // Initial Load
    useEffect(() => {
        loadCategories();
        loadBrands();
        loadColors();
    }, []);

    // ONE Unified Filter Trigger
    useEffect(() => {
        loadProducts(true);
    }, [selectedCategory, selectedBrand, stockOrder, sortBy, debouncedSearch]);

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
                pageNumber: reset ? '1' : page.toString(),
                pageSize: '20',
            });

            const res = await api.get(`/Product?${params.toString()}`);
            if (reset) {
                setProducts(res.data);
            } else {
                setProducts(prev => {
                    // dedupe just in case
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
            setBrands(res.data.map((b: any) => ({ Id: b.Id, Name: b.Name })));
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
    const getColorHex = (name: string) => colors.find(c => c.name === name)?.hex || null;
    const getStockStatus = (id: number) => {
        const p = products.find(prod => prod.Id === id);
        return (p?.TotalQuantity || 0) > 0;
    };

    // --- Modals ---
    // OPEN EDIT
    const openEditModal = async (product: Product) => {
        setCurrentProduct({ ...product, CategoryId: product.CategoryId || product.Category?.Id || 0 });
        setSelectedImages(product.ImageUrls ? [...product.ImageUrls] : []);
        setImageFiles([]);
        setStockItems([]);
        setDeletedVariantIds([]);
        await onCategoryChange(Number(product.CategoryId)); // Load relevant sizes

        // Load Variants
        try {
            const res = await api.get(`/ProductVariants/product/${product.Id}`);

            // HACK: because availableSizes state update might be slow, let's just map sizes by ID from the global fetch if simpler, or just trust the race condition won't bite often.
            // Or better, refetch sizes and pass to map.
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
            // 1. Upload new images
            const newImageUrls: string[] = [];
            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/Blob/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                newImageUrls.push(res.data);
            }

            const existingUrls = selectedImages.filter(img => img.startsWith('http'));
            const finalImageUrls = [...existingUrls, ...newImageUrls];

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
            alert('Failed to update product');
        }
    };

    // CREATE PRODUCT
    const openCreateModal = () => {
        setCurrentProduct(initialProductState);
        setSelectedImages([]);
        setImageFiles([]);
        setStockItems([]);
        setShowCreateModal(true);
    };

    const createProduct = async () => {
        try {
            const imageUrls: string[] = [];
            for (const file of imageFiles) {
                const formData = new FormData();
                formData.append('file', file);
                const res = await api.post('/Blob/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                imageUrls.push(res.data);
            }

            const payload = {
                Name: currentProduct.Name,
                ImageUrls: imageUrls,
                Description: currentProduct.Description,
                BasePrice: currentProduct.BasePrice,
                CategoryId: currentProduct.CategoryId,
                BrandId: currentProduct.BrandId
            };

            const res = await api.post('/Product', payload);
            const productId = res.data.id || res.data.Id;

            // Add Variants
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

            setShowCreateModal(false);
            loadProducts(true);

        } catch (e) {
            console.error(e);
            alert('Failed to create product');
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
            alert('Failed to delete product');
        }
    };

    // --- Handlers for Form ---
    const handleProductChange = (field: string, value: any) => {
        setCurrentProduct(prev => ({ ...prev, [field]: value }));
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
            // Note: removing from file list is trickier if we don't map 1:1 perfectly by index logic if mixed with strings. 
            // Simplification: if it's a blob url (uploaded now), remove from file list. if http, just remove from selectedImages.
            if (!img.startsWith('http')) {
                // This logic is imperfect without 1:1 mapping, but valid for basic needs. 
                // In Angular code: uses index match.
                const fileIdx = idx - selectedImages.filter(im => im.startsWith('http')).length;
                if (fileIdx >= 0) {
                    setImageFiles(prev => prev.filter((_, i) => i !== fileIdx));
                }
            }
        }
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

    // Barcode
    const onBarcodeScanned = (code: string) => {
        setShowBarcodeScanner(false);
        navigate(`/products/${code}`);
    };

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 2xl:px-40 flex flex-1 justify-center py-5 bg-gradient-to-br from-[#f8fcf9] to-white min-h-screen">
            <div className="layout-content-container flex flex-col w-full max-w-none flex-1">

                {/* Header */}
                <div className="flex flex-wrap justify-between items-center gap-3 p-4 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-2xl flex items-center justify-center shadow-lg">
                            <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-[#0e1b12] text-3xl md:text-4xl font-black leading-tight tracking-tight">Product List</p>
                        </div>
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => { setShowBarcodeScanner(true); setScannerEnabled(true); }}
                            className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-12 px-6 bg-gradient-to-r from-gray-900 to-black hover:from-black hover:to-gray-950 text-white text-sm font-bold leading-normal shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                            <span className="truncate">Scan Barcode</span>
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="flex min-w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl h-12 px-6 bg-gradient-to-r from-[#4e9767] to-[#3d7a52] hover:from-[#3d7a52] hover:to-[#2d5f3e] text-white text-sm font-bold leading-normal shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            <span className="truncate">Add Product</span>
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-4 py-3">
                    <label className="flex flex-col min-w-40 h-14 w-full">
                        <div className="flex w-full flex-1 items-stretch rounded-2xl h-full shadow-md hover:shadow-lg transition-shadow">
                            <div className="text-[#4e9767] flex border-none bg-white items-center justify-center pl-5 rounded-l-2xl border-r-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" fill="currentColor" viewBox="0 0 256 256"><path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z"></path></svg>
                            </div>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search products by name, brand, or category..."
                                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-2xl text-[#0e1b12] focus:outline-0 focus:ring-2 focus:ring-[#4e9767] border-none bg-white focus:border-none h-full placeholder:text-[#4e9767]/60 px-5 rounded-l-none border-l-0 pl-3 text-base font-medium leading-normal"
                            />
                        </div>
                    </label>
                </div>

                {/* Filters */}
                <div className="flex gap-3 p-3 flex-wrap pr-4">
                    {/* Filters logic is same as angular, just React selects */}
                    {/* SORT */}
                    <div className="relative">
                        <button className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                            <svg className="w-4 h-4 text-[#4e9767]" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" /></svg>
                            {sortBy || "Sort By"}
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256"><path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"></path></svg>
                        </button>
                        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                            <option value="">Sort by</option>
                            <option value="SKU">SKU</option>
                            <option value="Brand">Brand</option>
                            <option value="Price Ascending">Price Ascending</option>
                            <option value="Price Descending">Price Descending</option>
                        </select>
                    </div>

                    {/* BRAND */}
                    <div className="relative">
                        <button className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                            {selectedBrand === '' ? "Brand" : getBrandName(Number(selectedBrand))}
                        </button>
                        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                            <option value="">All Brands</option>
                            {brands.map(b => <option key={b.Id} value={b.Id}>{b.Name}</option>)}
                        </select>
                    </div>

                    {/* CATEGORY */}
                    <div className="relative">
                        <button className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                            {selectedCategory === '' ? "Category" : getCategoryNameById(Number(selectedCategory))}
                        </button>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                            <option value="">All Categories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {/* STOCK */}
                    <div className="relative">
                        <button className="flex h-10 items-center justify-center gap-x-2 rounded-xl bg-white hover:bg-gray-50 border-2 border-[#e7f3eb] hover:border-[#4e9767] pl-4 pr-3 text-[#0e1b12] text-sm font-semibold shadow-sm hover:shadow-md transition-all">
                            {stockOrder || "Stock Status"}
                        </button>
                        <select value={stockOrder} onChange={(e) => setStockOrder(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                            <option value="">Default</option>
                            <option value="Ascending">Ascending</option>
                            <option value="Descending">Descending</option>
                        </select>
                    </div>
                </div>

                {/* PRODUCTS GRID */}
                <div className="px-4 py-3">
                    <div className="rounded-2xl border-2 border-[#d0e7d7] bg-white shadow-xl p-6">
                        <div className="grid gap-6 grid-cols-2 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {products.map(product => (
                                <ProductCard
                                    key={product.Id}
                                    product={product}
                                    placeholderImage={placeholderImage}
                                    getStockStatus={getStockStatus}
                                    getCategoryNameById={(id) => getCategoryNameById(Number(id))}
                                    getBrandName={(id) => getBrandName(Number(id))}
                                    onEdit={openEditModal}
                                    onDelete={(id) => { setProductToDelete(id); setShowDeleteModal(true); }}
                                />
                            ))}
                        </div>

                        {/* Infinite Scroll Anchor */}
                        <div ref={containerRef} className="flex flex-col items-center justify-center py-8 mt-8">
                            {loading && (
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-[#e7f3eb] border-t-[#4e9767] rounded-full animate-spin"></div>
                                    <p className="text-[#4e9767] text-base font-semibold">Loading more products...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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
