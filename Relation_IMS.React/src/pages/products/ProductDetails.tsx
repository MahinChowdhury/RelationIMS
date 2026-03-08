import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';
import InventoryStockModal from '../../components/products/InventoryStockModal';

// ---------- Interfaces ----------
// Imported from ../../types
import type { Product, InventoryStock, ProductVariant } from '../../types';

interface ProductOrderItem {
    Id: number;
    OrderId: number;
    ProductId: number;
    Quantity: number;
    UnitPrice: number;
    Subtotal: number;
    Discount: number;
    CreatedAt: string;
    Order?: {
        Id: number;
        Customer?: { Id: number; Name: string };
        CreatedAt: string;
        PaymentStatus: number;
    };
    ProductVariant?: {
        Color?: { Id: number; Name: string };
        Size?: { Id: number; Name: string };
    };
}

interface ProductDetailsProps {
    productId?: string;
    isGuestView?: boolean;
}

export default function ProductDetails({ productId, isGuestView: propGuestView }: ProductDetailsProps) {
    const { id, hash, productId: urlProductId } = useParams<{ id: string, hash: string, productId: string }>();
    const activeId = productId || urlProductId || id;
    const { t } = useLanguage();
    const navigate = useNavigate();

    const isGuest = propGuestView || false;
    const [productDetail, setProductDetail] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageContainerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    // Inventory Modal State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [stockData, setStockData] = useState<InventoryStock[]>([]);
    const [selectedVariantName, setSelectedVariantName] = useState('');
    const [stockModalMode, setStockModalMode] = useState<'available' | 'defect'>('available');

    // Product Orders State
    const [productOrders, setProductOrders] = useState<ProductOrderItem[]>([]);
    const [ordersPage, setOrdersPage] = useState(1);
    const [ordersHasMore, setOrdersHasMore] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersInitialLoading, setOrdersInitialLoading] = useState(true);
    const [ordersVisible, setOrdersVisible] = useState(false);

    const sectionObserver = useRef<IntersectionObserver | null>(null);
    const ordersSectionRef = useCallback((node: HTMLDivElement | null) => {
        if (sectionObserver.current) sectionObserver.current.disconnect();
        if (!node || isGuest) return;
        sectionObserver.current = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setOrdersVisible(true);
                    sectionObserver.current?.disconnect();
                }
            },
            { threshold: 0.1 }
        );
        sectionObserver.current.observe(node);
    }, [isGuest]);

    const ordersObserver = useRef<IntersectionObserver | null>(null);
    const lastOrderRef = useCallback((node: HTMLTableRowElement | null) => {
        if (ordersLoading) return;
        if (ordersObserver.current) ordersObserver.current.disconnect();
        ordersObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && ordersHasMore) {
                setOrdersPage(prev => prev + 1);
            }
        });
        if (node) ordersObserver.current.observe(node);
    }, [ordersLoading, ordersHasMore]);

    useEffect(() => {
        if (activeId) {
            loadProductDetail(activeId);
            setProductOrders([]);
            setOrdersPage(1);
            setOrdersHasMore(true);
            setOrdersInitialLoading(true);
            setOrdersVisible(false);
        }
    }, [activeId]);

    useEffect(() => {
        if (activeId && !isGuest && ordersVisible) {
            loadProductOrders(ordersPage === 1);
        }
    }, [activeId, ordersPage, ordersVisible]);

    const imageUrls = productDetail?.ImageUrls || [];

    const goToNextImage = useCallback(() => {
        if (imageUrls.length === 0) return;
        const newIndex = (currentImageIndex + 1) % imageUrls.length;
        setCurrentImageIndex(newIndex);
        setSelectedImage(imageUrls[newIndex]);
    }, [currentImageIndex, imageUrls]);

    const goToPrevImage = useCallback(() => {
        if (imageUrls.length === 0) return;
        const newIndex = (currentImageIndex - 1 + imageUrls.length) % imageUrls.length;
        setCurrentImageIndex(newIndex);
        setSelectedImage(imageUrls[newIndex]);
    }, [currentImageIndex, imageUrls]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                goToPrevImage();
            } else if (e.key === 'ArrowRight') {
                goToNextImage();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNextImage, goToPrevImage]);

    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        const minSwipeDistance = 50;

        if (Math.abs(diff) > minSwipeDistance) {
            if (diff > 0) {
                goToNextImage();
            } else {
                goToPrevImage();
            }
        }
        touchStartX.current = null;
    };

    const loadProductDetail = async (productId: string) => {
        try {
            const res = await api.get<Product>(`/Product/${productId}`);
            setProductDetail(res.data);

            if (res.data.ImageUrls && res.data.ImageUrls.length > 0) {
                setSelectedImage(res.data.ImageUrls[0]);
                setCurrentImageIndex(0);
            }
        } catch (err) {
            console.error(`❌ Failed to load product details of id ${productId}:`, err);
        }
    };

    const fetchInventoryStock = async (variantId: number, colorName: string, sizeName: string, mode: 'available' | 'defect') => {
        setInventoryLoading(true);
        setStockData([]);
        setSelectedVariantName(`${colorName} - ${sizeName}`);
        setStockModalMode(mode);
        setShowInventoryModal(true);

        try {
            console.log(`Fetching inventory for variantId: ${variantId}`);
            const res = await api.get<InventoryStock[]>(`/Inventory/variant/${variantId}/stock`);
            setStockData(res.data);
        } catch (err) {
            console.error('Failed to load inventory stock:', err);
        } finally {
            setInventoryLoading(false);
        }
    };

    const loadProductOrders = async (isFirstPage: boolean) => {
        try {
            if (isFirstPage) {
                setOrdersInitialLoading(true);
            } else {
                setOrdersLoading(true);
            }
            const res = await api.get(`/OrderItem/product/${activeId}?pageNumber=${ordersPage}&pageSize=15`);
            const newItems: ProductOrderItem[] = res.data || [];
            setOrdersHasMore(newItems.length === 15);
            if (isFirstPage) {
                setProductOrders(newItems);
            } else {
                setProductOrders(prev => [...prev, ...newItems]);
            }
        } catch (err) {
            console.error('Failed to load product orders:', err);
        } finally {
            setOrdersInitialLoading(false);
            setOrdersLoading(false);
        }
    };

    const formatOrderDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Group items by OrderId and Color
    const groupedProductOrders = useMemo(() => {
        const groups = new Map<string, ProductOrderItem & { sizesWithQty: { name: string, qty: number }[], totalQuantity: number, totalSubtotal: number }>();

        productOrders.forEach(item => {
            const colorId = item.ProductVariant?.Color?.Id || 'no-color';
            const key = `${item.OrderId}_${colorId}`;
            const sizeName = item.ProductVariant?.Size?.Name || 'N/A';

            if (groups.has(key)) {
                const group = groups.get(key)!;
                const existingSize = group.sizesWithQty.find(s => s.name === sizeName);
                if (existingSize) {
                    existingSize.qty += item.Quantity;
                } else {
                    group.sizesWithQty.push({ name: sizeName, qty: item.Quantity });
                }
                group.totalQuantity += item.Quantity;
                group.totalSubtotal += item.Subtotal;
            } else {
                groups.set(key, {
                    ...item,
                    sizesWithQty: [{ name: sizeName, qty: item.Quantity }],
                    totalQuantity: item.Quantity,
                    totalSubtotal: item.Subtotal
                });
            }
        });

        return Array.from(groups.values());
    }, [productOrders]);

    const getPaymentStatusBadge = (status?: number) => {
        switch (status) {
            case 2: // Paid
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">
                        <span className="size-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        {t.common.paid}
                    </span>
                );
            case 1: // Partial
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800/30">
                        <span className="size-1.5 rounded-full bg-yellow-500"></span>
                        {t.orders.partial}
                    </span>
                );
            default: // Pending / Unknown
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                        <span className="size-1.5 rounded-full bg-gray-500"></span>
                        {t.common.pending}
                    </span>
                );
        }
    };

    const getStockStatus = () => {
        return (productDetail?.TotalQuantity ?? 0) > 0;
    };

    // Group variants by Color ID
    const groupedVariants = useMemo(() => {
        if (!productDetail?.Variants) return new Map<number | undefined, ProductVariant[]>();

        const map = new Map<number | undefined, ProductVariant[]>();
        for (const item of productDetail.Variants) {
            const key = item.Color?.Id;
            const group = map.get(key) ?? [];
            group.push(item);
            map.set(key, group);
        }
        return map;
    }, [productDetail]);

    if (!productDetail) {
        return <div className="p-8 text-center text-gray-500">{t.products.loadingDetails}</div>;
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex justify-between items-center">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    {isGuest && hash ? (
                        <>
                            <li className="inline-flex items-center">
                                <Link className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white" to={`/products/share-catalog/${hash}`}>
                                    <span className="material-symbols-outlined text-[18px] mr-1">list</span>
                                    {'Catalog'}
                                </Link>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{productDetail.Name}</span>
                                </div>
                            </li>
                        </>
                    ) : (
                        <>
                            <li className="inline-flex items-center">
                                <Link className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white" to="/dashboard">
                                    <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                                    {t.nav.dashboard}
                                </Link>
                            </li>
                            <li>
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    <Link className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white" to="/products">{t.nav.products}</Link>
                                </div>
                            </li>
                            <li aria-current="page">
                                <div className="flex items-center">
                                    <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                    <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{productDetail.Name}</span>
                                </div>
                            </li>
                        </>
                    )}
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Images */}
                <div className="lg:col-span-6 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-4 flex flex-col items-center">
                        <div
                            className="relative w-full min-h-[400px] flex items-center justify-center bg-gray-50 dark:bg-black/20 rounded-lg overflow-hidden mb-4 group"
                            ref={imageContainerRef}
                            onTouchStart={handleTouchStart}
                            onTouchEnd={handleTouchEnd}
                        >
                            <div
                                className="absolute inset-0 w-full h-full bg-contain bg-center bg-no-repeat"
                                style={{ backgroundImage: `url(${selectedImage})` }}
                            ></div>

                            {imageUrls.length > 1 && (
                                <>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToPrevImage(); }}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                                        aria-label="Previous image"
                                    >
                                        <span className="material-symbols-outlined text-[24px]">chevron_left</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); goToNextImage(); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 size-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 backdrop-blur-sm"
                                        aria-label="Next image"
                                    >
                                        <span className="material-symbols-outlined text-[24px]">chevron_right</span>
                                    </button>
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-medium">
                                        {currentImageIndex + 1} / {imageUrls.length}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 w-full overflow-x-auto pb-2">
                            {productDetail.ImageUrls?.map((image, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => { setSelectedImage(image); setCurrentImageIndex(idx); }}
                                    className={`w-16 h-16 shrink-0 rounded-lg border-2 ${selectedImage === image ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} overflow-hidden relative hover:border-primary/50 transition-colors`}
                                >
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }}></div>
                                </button>
                            ))}
                            {!isGuest && (
                                <button className="w-16 h-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                                    <span className="material-symbols-outlined">add_a_photo</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stock & Info */}
                <div className="lg:col-span-6 flex flex-col gap-6">

                    {/* Stock Table or Guest Colors list */}
                    {!isGuest ? (
                        <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                            <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">inventory_2</span>
                                {t.products.stockAndVariants}
                            </h2>
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a4032]">
                                <table className="w-full text-sm text-center">
                                    <thead>
                                        <tr className="bg-[#4e9767] text-white">
                                            <th className="py-3 px-4 font-bold uppercase text-xs">{t.products.color}</th>
                                            <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">{t.products.size}</th>
                                            <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">Available</th>
                                            <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">Reserved</th>
                                            <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">{t.products.defects}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-[#112116] divide-y divide-gray-100 dark:divide-[#2a4032]">
                                        {Array.from(groupedVariants).map(([_, variants]) => (
                                            variants.map((variant, idx) => {
                                                const isFirst = idx === 0;
                                                return (
                                                    <tr key={variant.Id}>
                                                        {isFirst && (
                                                            <td rowSpan={variants.length} className="py-3 px-4">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    {variant.Color?.HexCode && (
                                                                        <span
                                                                            className="w-4 h-4 rounded-full border border-gray-300"
                                                                            style={{ backgroundColor: variant.Color.HexCode }}
                                                                        ></span>
                                                                    )}
                                                                    <span className="text-text-main dark:text-gray-300">{variant.Color?.Name}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="py-3 px-4 text-text-main dark:text-gray-300">{variant.Size?.Name || 'N/A'}</td>
                                                        <td className="py-3 px-4">
                                                            <button
                                                                onClick={() => fetchInventoryStock(variant.Id, variant.Color?.Name || '', variant.Size?.Name || '', 'available')}
                                                                className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold dark:bg-green-900/40 dark:text-green-300 hover:underline cursor-pointer"
                                                            >
                                                                {(variant.Quantity || 0) - (variant.ReservedQuantity || 0)}
                                                            </button>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${(variant.ReservedQuantity ?? 0) > 0 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}>
                                                                {(variant.ReservedQuantity ?? 0)}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <button
                                                                onClick={() => fetchInventoryStock(variant.Id, variant.Color?.Name || '', variant.Size?.Name || '', 'defect')}
                                                                className={`inline-block px-2 py-1 rounded text-xs font-bold hover:underline cursor-pointer ${variant.Defects > 0 ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300' : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'}`}
                                                            >
                                                                {variant.Defects}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                                <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">palette</span>
                                    {t.products.color}
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {Array.from(groupedVariants).map(([_, variants]) => (
                                        <div key={variants[0].Id} className="flex items-center gap-2 bg-gray-50 dark:bg-[#112116] border border-gray-100 dark:border-[#2a4032] px-3 py-2 rounded-lg">
                                            {variants[0].Color?.HexCode && (
                                                <span
                                                    className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 shadow-sm"
                                                    style={{ backgroundColor: variants[0].Color.HexCode }}
                                                ></span>
                                            )}
                                            <span className="text-sm font-semibold text-text-main dark:text-gray-300">
                                                {variants[0].Color?.Name || 'Unknown Color'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                                <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">straighten</span>
                                    {t.products.size}
                                </h2>
                                <div className="flex flex-wrap gap-4">
                                    {(() => {
                                        const availableSizes = Array.from(new Set(
                                            Array.from(groupedVariants).flatMap(([_, variants]) =>
                                                variants.filter(v => ((v.Quantity || 0) - (v.ReservedQuantity || 0)) > 0).map(v => v.Size?.Name)
                                            ).filter(Boolean)
                                        ));

                                        if (availableSizes.length === 0) {
                                            return <span className="text-sm text-gray-500">No available sizes</span>;
                                        }

                                        return availableSizes.map((sizeName, idx) => (
                                            <div key={idx} className="flex items-center justify-center bg-gray-50 dark:bg-[#112116] border border-gray-100 dark:border-[#2a4032] min-w-[3rem] px-3 py-2 rounded-lg">
                                                <span className="text-sm font-semibold text-text-main dark:text-gray-300">
                                                    {sizeName}
                                                </span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Product Header Card */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-text-main dark:text-white tracking-tight">{productDetail.Name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                                    SKU: {productDetail.Id}
                                </span>
                                {!isGuest && (
                                    <span className={`bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${getStockStatus() ? 'bg-primary' : 'bg-red-500'}`}></span>
                                        {getStockStatus() ? t.products.inStock : t.products.outOfStock}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">{t.products.retailPrice}</p>
                            <p className="text-3xl font-black text-text-main dark:text-white">${productDetail.MSRP.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Product Details Cards */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                        <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            {t.products.productDetails}
                        </h2>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">{t.common.description}</label>
                                <div className="bg-gray-50 dark:bg-[#112116] p-4 rounded-lg border border-gray-100 dark:border-[#2a4032]">
                                    <p className="text-sm text-text-main dark:text-gray-300 leading-relaxed">
                                        {productDetail.Description}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                {/* LEFT SIDE – MSRP, Base Price, Cost Price */}
                                <div className="flex flex-col gap-4">

                                    {/* MSRP */}
                                    <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                        <div className="bg-blue-500 text-white p-1 rounded-md shadow-sm shadow-blue-500/20 shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">price_check</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.msrp}</span>
                                            <span className="text-lg font-extrabold text-text-main dark:text-white">
                                                ${(productDetail.MSRP || 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Base Price - Hide for guests */}
                                    {!isGuest && (
                                        <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                            <div className="bg-red-500 text-white p-1 rounded-md shadow-sm shadow-red-500/20 shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">attach_money</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.basePrice}</span>
                                                <span className="text-lg font-extrabold text-red-500 dark:text-white">
                                                    ${(productDetail.BasePrice || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Cost Price - Hide for guests */}
                                    {!isGuest && (
                                        <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                            <div className="bg-green-500 text-white p-1 rounded-md shadow-sm shadow-green-500/20 shrink-0">
                                                <span className="material-symbols-outlined text-[20px]">inventory</span>
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.costPrice}</span>
                                                <span className="text-lg font-extrabold text-blue-500 dark:text-white">
                                                    ${(productDetail.CostPrice || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* RIGHT SIDE – Category, Brand, Quarter */}
                                <div className="flex flex-col gap-4">

                                    {/* Category */}
                                    <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                        <div className="bg-white dark:bg-[#1a2e22] p-2 rounded-md shadow-sm text-primary shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">category</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.category}</span>
                                            <span className="text-sm font-bold text-text-main dark:text-white truncate">
                                                {productDetail.Category?.Name || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Brand */}
                                    <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                        <div className="bg-white dark:bg-[#1a2e22] p-2 rounded-md shadow-sm text-primary shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">verified</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.brand}</span>
                                            <span className="text-sm font-bold text-text-main dark:text-white truncate">
                                                {productDetail.Brand?.Name || 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Quarter */}
                                    <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                        <div className="bg-white dark:bg-[#1a2e22] p-2 rounded-md shadow-sm text-primary shrink-0">
                                            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] font-bold uppercase text-text-secondary">{t.products.quarter}</span>
                                            <span className="text-sm font-bold text-text-main dark:text-white truncate">
                                                {productDetail.Quarters && productDetail.Quarters.length > 0 ? productDetail.Quarters.map((q: any) => q.Name).join(', ') : 'N/A'}
                                            </span>
                                        </div>
                                    </div>

                                </div>

                            </div>

                        </div>
                    </div>

                </div>
            </div >

            {/* Product Orders Section */}
            {!isGuest && (
                <div ref={ordersSectionRef} className="glass-panel rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/60 dark:border-[#2a4032] overflow-hidden flex flex-col">
                    <div className="p-5 border-b border-gray-100/50 dark:border-[#2a4032] flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-text-main dark:text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[20px]">shopping_cart</span>
                            {t.products.orderHistory}
                            <span className="text-xs font-medium text-text-secondary ml-1">({productOrders.length} {t.products.loaded})</span>
                        </h2>
                    </div>

                    {ordersInitialLoading ? (
                        <div className="flex-1 flex items-center justify-center py-12">
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                                <p className="text-text-secondary text-sm">{t.orders.loadingOrders}</p>
                            </div>
                        </div>
                    ) : productOrders.length === 0 ? (
                        <div className="py-12 text-center text-text-secondary">
                            <span className="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-2 block">receipt_long</span>
                            {t.products.noOrdersFound}
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-sm text-left text-text-main dark:text-gray-300">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 dark:bg-[#132219]/50 dark:text-gray-400 border-b border-gray-100/50 dark:border-[#2a4032]">
                                        <tr>
                                            <th scope="col" className="px-6 py-4 font-semibold">{t.orders.orderId}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">{t.common.customer}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">{t.inventory.variant}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold text-center">{t.common.quantity}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold text-right">{t.products.soldPrice}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">{t.common.status}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold">{t.common.date}</th>
                                            <th scope="col" className="px-6 py-4 font-semibold text-right">{t.common.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100/50 dark:divide-[#2a4032]">
                                        {groupedProductOrders.map((item, index) => {
                                            const isLast = groupedProductOrders.length === index + 1;

                                            // Format the variant string to show Color / [Size1, Size2, ...]
                                            const colorName = item.ProductVariant?.Color?.Name || '—';

                                            return (
                                                <tr
                                                    key={`${item.OrderId}_${item.ProductVariant?.Color?.Id || 'no-color'}`}
                                                    ref={isLast ? lastOrderRef : null}
                                                    className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors group"
                                                >
                                                    <td className="px-6 py-4 align-top">
                                                        <span className="font-bold text-primary mt-1 block">#ORD-{item.OrderId}</span>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0 border border-white dark:border-[#2a4032] shadow-sm">
                                                                {item.Order?.Customer?.Name?.substring(0, 2).toUpperCase() || '?'}
                                                            </div>
                                                            <span className="font-medium text-text-main dark:text-gray-200 truncate max-w-[140px]">{item.Order?.Customer?.Name || t.common.notAvailable}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 align-top">
                                                        <div className="flex flex-col gap-2">
                                                            <div>
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-[#112116] dark:text-gray-300 border border-gray-200 dark:border-[#2a4032] shadow-sm">
                                                                    {colorName}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col gap-1 w-full max-w-[150px]">
                                                                {item.sizesWithQty.map((s, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between bg-gray-50 dark:bg-black/20 px-2 py-1 rounded text-[11px] text-gray-600 dark:text-gray-400 border border-gray-100 dark:border-white/5">
                                                                        <span className="truncate mr-2 font-medium">{s.name !== 'N/A' && s.name !== '-' ? s.name : t.common.notAvailable}</span>
                                                                        <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-[#2a4032] px-1.5 rounded">x{s.qty}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center align-top">
                                                        <span className="font-bold text-lg text-primary mt-1 block">{item.totalQuantity}</span>
                                                    </td>
                                                    <td className="px-6 py-4 font-bold text-right align-top">
                                                        <span className="mt-1 block">${item.totalSubtotal.toFixed(2)}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {getPaymentStatusBadge(item.Order?.PaymentStatus)}
                                                    </td>
                                                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{formatOrderDate(item.Order?.CreatedAt)}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            onClick={() => navigate(`/orders/${item.OrderId}`)}
                                                            className="size-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all border border-transparent hover:border-blue-200"
                                                            title={t.products.viewOrder}
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {ordersLoading && (
                                <div className="p-4 border-t border-gray-100/50 dark:border-[#2a4032] flex justify-center">
                                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-primary border-gray-200"></div>
                                </div>
                            )}
                            <div className="p-4 border-t border-gray-100/50 dark:border-[#2a4032] flex items-center justify-between bg-gray-50/20 backdrop-blur-sm">
                                <span className="text-xs text-text-secondary">{t.products.showingVariantGroups.replace('{groups}', groupedProductOrders.length.toString()).replace('{total}', productOrders.length.toString())}</span>
                            </div>
                        </>
                    )}
                </div>
            )}

            {!isGuest && (
                <InventoryStockModal
                    show={showInventoryModal}
                    onClose={() => setShowInventoryModal(false)}
                    stockData={stockData}
                    loading={inventoryLoading}
                    variantName={selectedVariantName}
                    mode={stockModalMode}
                />
            )}
        </div >
    );
}
