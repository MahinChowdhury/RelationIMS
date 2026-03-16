import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import ProductCard from '../../components/products/ProductCard';
import { ProductFormModal, DeleteProductModal } from '../../components/products/ProductModals';
import BarcodeScanner from '../../components/BarcodeScanner';

import UploadProgressToast, { type UploadToast } from '../../components/products/UploadProgressToast';
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
    const [thumbnailMap, setThumbnailMap] = useState<Record<string, string>>({});

    // Upload Toast State
    const [uploadToasts, setUploadToasts] = useState<UploadToast[]>([]);

    const addToast = useCallback((toast: UploadToast) => {
        setUploadToasts(prev => [...prev, toast]);
    }, []);

    const updateToast = useCallback((id: string, updates: Partial<UploadToast>) => {
        setUploadToasts(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    const dismissToast = useCallback((id: string) => {
        setUploadToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const generateThumbnail = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d')!;
                const maxSize = 400;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxSize) {
                        height *= maxSize / width;
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width *= maxSize / height;
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.85));
            };
            img.src = URL.createObjectURL(file);
        });
    };

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

        // Capture current state before closing modal
        const imagesToProcess = [...selectedImages];
        const imageMapSnapshot = { ...imageMap };
        const stockSnapshot = [...stockItems];
        const productSnapshot = { ...currentProduct };
        const deletedIds = [...deletedVariantIds];
        const colorsSnapshot = [...colors];
        const sizesSnapshot = [...availableSizes];

        // Close modal immediately
        setShowEditModal(false);

        const toastId = `edit-${Date.now()}`;
        const newImageCount = imagesToProcess.filter(img => !(img.startsWith('http') && !img.startsWith('blob:')) && imageMapSnapshot[img]).length;

        if (newImageCount > 0) {
            addToast({ id: toastId, type: 'uploading', message: 'Uploading images...', current: 0, total: newImageCount });
        }

        try {
            // 1. Upload new images in the correct order
            let uploaded = 0;
            const finalImageUrls: string[] = [];
            for (const img of imagesToProcess) {
                if (img.startsWith('http') && !img.startsWith('blob:')) {
                    finalImageUrls.push(img);
                } else if (imageMapSnapshot[img]) {
                    const formData = new FormData();
                    formData.append('file', imageMapSnapshot[img]);
                    const res = await api.post('/Blob/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
                    finalImageUrls.push(res.data);
                    uploaded++;
                    updateToast(toastId, { current: uploaded, message: `Uploading image ${uploaded} of ${newImageCount}...` });
                }
            }

            // 2. Delete removed variants
            for (const vId of deletedIds) {
                await api.delete(`/ProductVariants/${vId}`).catch(e => console.error(e));
            }

            // 3. Update/Create variants
            for (const item of stockSnapshot) {
                const colorId = colorsSnapshot.find(c => c.name === item.color)?.id;
                const sizeId = sizesSnapshot.find(s => s.name === item.size)?.id;

                if (!colorId || !sizeId) continue;

                const payload = {
                    ProductId: productSnapshot.Id,
                    ProductColorId: colorId,
                    ProductSizeId: sizeId,
                    VariantPrice: productSnapshot.BasePrice,
                    CostPrice: productSnapshot.CostPrice,
                    MSRP: productSnapshot.MSRP,
                    Quantity: item.quantity
                };

                if (item.id && item.id !== 0) {
                    await api.put(`/ProductVariants/${item.id}`, { Id: item.id, ...payload }).catch(e => console.error(e));
                } else {
                    await api.post(`/ProductVariants`, { ...payload, DefaultInventoryId: 1 }).catch(e => console.error(e));
                }
            }

            // 4. Update Product
            await api.put(`/Product/${productSnapshot.Id}`, {
                ...productSnapshot,
                ImageUrls: finalImageUrls
            });

            // Show success toast
            if (newImageCount > 0) {
                updateToast(toastId, { type: 'success', message: `Product updated! ${newImageCount} image${newImageCount > 1 ? 's' : ''} uploaded.` });
            } else {
                addToast({ id: toastId, type: 'success', message: 'Product updated successfully!' });
            }

            loadProducts(true);

        } catch (e) {
            console.error(e);
            updateToast(toastId, { type: 'success', message: 'Failed to update product. Please try again.' });
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
        // Capture state snapshots before closing modal
        const imagesToUpload = [...selectedImages];
        const imageMapSnapshot = { ...imageMap };
        const stockSnapshot = [...stockItems];
        const productSnapshot = { ...currentProduct };
        const colorsSnapshot = [...colors];
        const sizesSnapshot = [...availableSizes];
        const imageCount = imagesToUpload.filter(img => imageMapSnapshot[img]).length;

        // Close modal immediately
        setShowCreateModal(false);
        setCurrentProduct(initialProductState);
        setSelectedImages([]);
        setImageMap({});
        setStockItems([]);
        setNewStock({ color: '', size: '', quantity: 0 });

        const toastId = `create-${Date.now()}`;
        addToast({ id: toastId, type: 'uploading', message: 'Creating product...', current: 0, total: 1 });

        try {
            const formData = new FormData();
            formData.append('Name', productSnapshot.Name);
            formData.append('Description', productSnapshot.Description || '');
            formData.append('BasePrice', productSnapshot.BasePrice?.toString() || '0');
            formData.append('CostPrice', productSnapshot.CostPrice?.toString() || '0');
            formData.append('MSRP', productSnapshot.MSRP?.toString() || '0');
            formData.append('CategoryId', productSnapshot.CategoryId.toString());
            formData.append('BrandId', productSnapshot.BrandId.toString());
            if (productSnapshot.QuarterIds && productSnapshot.QuarterIds.length > 0) {
                productSnapshot.QuarterIds.forEach((id: number) => {
                    formData.append('QuarterIds', id.toString());
                });
            }

            // Append images
            imagesToUpload.forEach(img => {
                if (imageMapSnapshot[img]) {
                    formData.append('Images', imageMapSnapshot[img]);
                }
            });

            // Product creation - backend handles image upload in background
            const res = await api.post('/Product', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const productId = res.data.id || res.data.Id;

            // Add Variants
            if (productId && stockSnapshot.length > 0) {
                for (const stock of stockSnapshot) {
                    const colorId = colorsSnapshot.find(c => c.name === stock.color)?.id;
                    const sizeId = sizesSnapshot.find(s => s.name === stock.size)?.id;

                    if (colorId && sizeId) {
                        try {
                            await api.post('/ProductVariants', {
                                ProductId: productId,
                                ProductColorId: colorId,
                                ProductSizeId: sizeId,
                                VariantPrice: productSnapshot.BasePrice,
                                CostPrice: productSnapshot.CostPrice,
                                MSRP: productSnapshot.MSRP,
                                Quantity: stock.quantity,
                                DefaultInventoryId: 1
                            });
                        } catch (variantErr) {
                            console.error('Failed to create variant:', variantErr);
                        }
                    }
                }
            }

            // If images were included, poll until backend finishes processing
            if (imageCount > 0 && productId) {
                updateToast(toastId, { type: 'uploading', message: `Product created! Processing ${imageCount} image${imageCount > 1 ? 's' : ''}...`, current: 0, total: imageCount });

                // Poll every 600ms for up to 60s
                const maxAttempts = 100;
                let attempt = 0;
                let simulatedCount = 0;

                const pollInterval = setInterval(async () => {
                    attempt++;
                    try {
                        const productRes = await api.get<Product>(`/Product/${productId}`);
                        const uploadedCount = productRes.data.ImageUrls?.length || 0;

                        // Calculate simulated progress
                        // Increment fast to make the bar feel snappy.
                        // Cap the simulation at ~97% of the bar
                        if (uploadedCount < imageCount) {
                            simulatedCount = Math.min(simulatedCount + (3.5 / imageCount), imageCount - 0.1);
                        } else {
                            simulatedCount = uploadedCount; // Snap to 100%
                        }

                        // Use actual count if it's magically higher, else simulated
                        const displayCount = Math.max(uploadedCount, simulatedCount);

                        updateToast(toastId, {
                            current: displayCount,
                            message: `Processing images... (${Math.floor(displayCount)}/${imageCount})`
                        });

                        if (uploadedCount >= imageCount || attempt >= maxAttempts) {
                            clearInterval(pollInterval);
                            loadProducts(true);
                            if (uploadedCount >= imageCount) {
                                updateToast(toastId, { type: 'success', message: `All ${imageCount} image${imageCount > 1 ? 's' : ''} uploaded successfully!` });
                            } else {
                                updateToast(toastId, { type: 'info', message: `Processing taking longer than expected. Images will appear soon.` });
                            }
                        }
                    } catch {
                        // Silently continue polling
                    }
                }, 600);
            } else {
                updateToast(toastId, { type: 'success', message: 'Product created successfully!' });
            }

        } catch (e) {
            console.error(e);
            updateToast(toastId, { type: 'success', message: 'Failed to create product. Please try again.' });
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

    const onImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newMap = { ...imageMap };
            const newThumbnails = { ...thumbnailMap };
            const newUrls: string[] = [];

            for (const file of files) {
                const url = URL.createObjectURL(file);
                newMap[url] = file;
                newUrls.push(url);
                const thumbnail = await generateThumbnail(file);
                newThumbnails[url] = thumbnail;
            }

            setImageMap(newMap);
            setThumbnailMap(newThumbnails);
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
        if (thumbnailMap[img]) {
            setThumbnailMap(prev => {
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
            setStockItems(stockItems.map(s => s === exists ? { ...s, quantity: s.quantity + newStock.quantity } : s));
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



    return (
        <div className="container mx-auto max-w-screen-2xl px-4 py-4 md:px-6 md:py-6 flex flex-col gap-4">




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
                                    : 'text-gray-500 md:hover:text-[#4e9767] md:hover:bg-gray-100 dark:md:hover:bg-white/5'
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
                thumbnailMap={thumbnailMap}
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
                thumbnailMap={thumbnailMap}
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

            {/* Floating Upload Progress Toast */}
            <UploadProgressToast toasts={uploadToasts} onDismiss={dismissToast} />
        </div>
    );
}
