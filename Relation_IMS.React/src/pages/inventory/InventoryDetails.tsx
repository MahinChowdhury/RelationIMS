
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import useIntersectionObserver from '../../hooks/useIntersectionObserver';

import { type Inventory } from '../../types';

interface ProductAggregated {
    ProductId: number;
    VariantId: number;
    Name: string;
    Sku: string;
    CategoryName: string;
    ImageUrl?: string;
    Quantity: number;
    Price: number;
    Status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export default function InventoryDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const inventoryId = Number(id);

    // State
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [allItems, setAllItems] = useState<any[]>([]); // Raw items from API
    const [aggregatedProducts, setAggregatedProducts] = useState<ProductAggregated[]>([]);
    const [displayedProducts, setDisplayedProducts] = useState<ProductAggregated[]>([]);

    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const ITEMS_PER_PAGE = 20;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low-stock'>('all');

    // Infinite Scroll
    const { containerRef, isVisible } = useIntersectionObserver({ threshold: 1.0 });

    useEffect(() => {
        if (!inventoryId) return;
        loadInventoryData();
    }, [inventoryId]);

    // Apply Search & Aggregation
    useEffect(() => {
        if (!allItems.length && !loading) {
            setAggregatedProducts([]);
            setDisplayedProducts([]);
            return;
        }

        // 1. Aggregate Items by Product/Variant
        const aggMap = new Map<string, ProductAggregated>();

        allItems.forEach(item => {
            // Backend returns a flat DTO, not nested. properties are camelCase.
            // Check DTO: Id, Code, ProductId, ProductVariantId, ProductName, ColorName, SizeName, ProductImageUrl...

            if (!item.ProductId && !item.productVariantId) return; // Basic validation

            // Key combines ProductId to denote a unique variant
            // We use camelCase properties as that's typically how .NET serializes by default
            const productId = item.productId || item.ProductId;
            // const variantId = item.productVariantId || item.ProductVariantId;
            const productName = item.productName || item.ProductName;
            const itemCode = item.code || item.Code;
            const categoryName = item.categoryName || item.CategoryName || 'Uncategorized'; // DTO might differ, check if category is sent
            const imageUrl = item.productImageUrl || item.ProductImageUrl || '';
            const price = item.price || item.Price || 0; // Price might not be in summary DTO!

            const key = `${productId}`;

            if (!aggMap.has(key)) {
                aggMap.set(key, {
                    ProductId: productId,
                    VariantId: 0,
                    Name: productName,
                    Sku: itemCode, // We'll just use the first code we see as display SKU
                    CategoryName: categoryName,
                    ImageUrl: imageUrl,
                    Quantity: 0,
                    Price: price,
                    Status: 'In Stock'
                });
            }

            const agg = aggMap.get(key)!;
            agg.Quantity += 1;
        });

        let result = Array.from(aggMap.values());

        // 2. Filter
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.Name.toLowerCase().includes(lower) ||
                p.Sku.toLowerCase().includes(lower)
            );
        }

        if (stockStatusFilter === 'low-stock') {
            result = result.filter(p => p.Quantity < 10);
        }

        setAggregatedProducts(result);
        setPage(1);
        setDisplayedProducts(result.slice(0, ITEMS_PER_PAGE));
        setHasMore(result.length > ITEMS_PER_PAGE);

    }, [allItems, searchTerm, stockStatusFilter]);

    // Handle Infinite Scroll
    useEffect(() => {
        if (isVisible && !loading && hasMore) {
            const nextPage = page + 1;
            const nextItems = aggregatedProducts.slice(0, nextPage * ITEMS_PER_PAGE);
            setDisplayedProducts(nextItems);
            setPage(nextPage);
            if (nextItems.length >= aggregatedProducts.length) {
                setHasMore(false);
            }
        }
    }, [isVisible]);

    const loadInventoryData = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [invRes, itemsRes] = await Promise.all([
                api.get<Inventory>(`/Inventory/${inventoryId}`),
                api.get(`/Inventory/${inventoryId}/items`)
            ]);

            setInventory(invRes.data);
            setAllItems(itemsRes.data || []);
        } catch (err) {
            console.error("Failed to load inventory details", err);
        } finally {
            setLoading(false);
        }
    };

    // Calculation Stats
    const totalSkus = aggregatedProducts.length;
    const totalUnits = aggregatedProducts.reduce((sum, p) => sum + p.Quantity, 0);
    const lowStockCount = aggregatedProducts.filter(p => p.Quantity < 10).length;
    const stockValue = aggregatedProducts.reduce((sum, p) => sum + (p.Quantity * p.Price), 0);

    return (
        <div className="flex bg-background-light dark:bg-transparent font-display text-text-main antialiased h-full overflow-y-auto">
            <div className="container mx-auto max-w-7xl px-4 py-4 md:px-8 md:py-8 flex flex-col gap-6 md:gap-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="flex">
                    <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                        <li className="inline-flex items-center">
                            <Link to="/dashboard" className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white">
                                <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                                Dashboard
                            </Link>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                <Link to="/inventory" className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white">Inventory</Link>
                            </div>
                        </li>
                        <li>
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                <Link to="/inventory/locations" className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white">Locations</Link>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div className="flex items-center">
                                <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                                <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{inventory?.Name || 'Loading...'}</span>
                            </div>
                        </li>
                    </ol>
                </nav>

                <div className="flex flex-col gap-6">
                    {/* Hero Section */}
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                            <div className="p-4 rounded-xl bg-white dark:bg-[#1a2e22] shadow-sm border border-gray-100 dark:border-[#2a4032]">
                                <span className="material-symbols-outlined text-4xl text-primary">warehouse</span>
                            </div>
                            <div className="flex flex-col gap-3 w-full max-w-xl">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-text-main dark:text-white tracking-tight flex items-center gap-3">
                                        {inventory?.Name || 'Inventory Location'}
                                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold border border-green-200 dark:border-green-800">Operational</span>
                                    </h1>
                                    <p className="text-text-secondary dark:text-gray-400 text-sm flex items-center gap-2 mt-1">
                                        <span className="material-symbols-outlined text-[16px]">pin_drop</span>
                                        Location ID: #{inventoryId} • Main Storage
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 self-start md:self-start mt-2">
                            <button
                                onClick={() => navigate('/inventory/transfer')}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-main bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-[#1a2e22] dark:border-[#2a4032] dark:text-white dark:hover:bg-white/5 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">swap_horiz</span>
                                <span>Transfer Stock</span>
                            </button>
                            <button
                                onClick={() => navigate('/inventory/stock-in')}
                                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-green-600 transition-all shadow-sm">
                                <span className="material-symbols-outlined text-[20px]">add</span>
                                <span>Add Product</span>
                            </button>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-sm flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                <span className="material-symbols-outlined">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase">Total SKUs</p>
                                <p className="text-xl font-bold text-text-main dark:text-white">{totalSkus.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-sm flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <span className="material-symbols-outlined">layers</span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase">Total Units</p>
                                <p className="text-xl font-bold text-text-main dark:text-white">{totalUnits.toLocaleString()}</p>
                            </div>
                        </div>
                        <div
                            onClick={() => setStockStatusFilter(prev => prev === 'low-stock' ? 'all' : 'low-stock')}
                            className={`bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-sm flex items-center gap-4 relative overflow-hidden group cursor-pointer transition-all ${stockStatusFilter === 'low-stock' ? 'ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                            <div className="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-orange-50 to-transparent dark:from-orange-900/10 opacity-50"></div>
                            <div className="size-12 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <span className="material-symbols-outlined">warning</span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase">Low Stock Alerts</p>
                                <p className="text-xl font-bold text-text-main dark:text-white">{lowStockCount} Items</p>
                            </div>
                        </div>
                        <div className="bg-white dark:bg-[#1a2e22] p-4 rounded-xl border border-gray-100 dark:border-[#2a4032] shadow-sm flex items-center gap-4">
                            <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                <span className="material-symbols-outlined">attach_money</span>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-text-secondary uppercase">Stock Value</p>
                                <p className="text-xl font-bold text-text-main dark:text-white">৳{stockValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-[#1a2e22] rounded-xl border border-gray-200 dark:border-[#2a4032] shadow-sm flex flex-col">
                    <div className="p-5 border-b border-gray-100 dark:border-[#2a4032] flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-lg font-bold text-text-main dark:text-white">Products in This Inventory</h2>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative flex-1 sm:w-64">
                                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[20px]">search</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-[#2a4032] rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-text-main dark:text-white placeholder-gray-400"
                                    placeholder="Search by name or SKU..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-transparent dark:border-[#2a4032] dark:text-gray-300 dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-[18px]">filter_list</span>
                                <span>Filter</span>
                            </button>
                            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-text-secondary bg-white border border-gray-200 rounded-lg hover:bg-gray-50 dark:bg-transparent dark:border-[#2a4032] dark:text-gray-300 dark:hover:bg-white/5 transition-all">
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span>Export</span>
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-text-secondary uppercase bg-gray-50 dark:bg-[#112116] border-b border-gray-100 dark:border-[#2a4032]">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Product Details</th>
                                    <th className="px-6 py-4 font-bold">Category</th>
                                    <th className="px-6 py-4 font-bold text-center">In Stock</th>
                                    <th className="px-6 py-4 font-bold text-right">Unit Price</th>
                                    <th className="px-6 py-4 font-bold text-right">Value</th>
                                    <th className="px-6 py-4 font-bold text-center">Status</th>
                                    <th className="px-6 py-4 font-bold text-center w-28">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-[#2a4032]">
                                {displayedProducts.map((p, idx) => (
                                    <tr key={`${p.ProductId}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-200 dark:border-[#2a4032] shrink-0"
                                                    style={{ backgroundImage: `url("${p.ImageUrl}")` }}></div>
                                                <div>
                                                    <p className="font-bold text-text-main dark:text-white text-base truncate max-w-[200px]" title={p.Name}>{p.Name}</p>
                                                    <p className="text-xs text-text-secondary font-mono">SKU: {p.Sku}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-text-secondary dark:text-gray-400">{p.CategoryName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <span className={`font-bold text-base ${p.Quantity < 10 ? 'text-red-600 dark:text-red-400' : 'text-text-main dark:text-white'}`}>{p.Quantity}</span>
                                                <span className={`text-[10px] ${p.Quantity < 10 ? 'text-red-500' : 'text-text-secondary'}`}>units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-text-main dark:text-gray-300">৳{p.Price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-text-main dark:text-white">৳{(p.Quantity * p.Price).toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            {p.Quantity === 0 ? (
                                                <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-700/30 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-600">Out of Stock</span>
                                            ) : p.Quantity < 10 ? (
                                                <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/30">Low Stock</span>
                                            ) : (
                                                <span className="px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold border border-green-100 dark:border-green-900/30">In Stock</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition-colors" title="Stock In"
                                                    onClick={() => navigate(`/inventory/stock-in?productId=${p.ProductId}`)}>
                                                    <span className="material-symbols-outlined text-[20px]">add_box</span>
                                                </button>
                                                <button className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-white/10 transition-colors" title="View Detail"
                                                    onClick={() => navigate(`/products/${p.ProductId}`)}>
                                                    <span className="material-symbols-outlined text-[20px]">visibility</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Loading / Sentinel */}
                        <div ref={containerRef} className="flex flex-col items-center justify-center py-6">
                            {loading || (allItems.length > 0 && aggregatedProducts.length === 0) ? (
                                <div className="flex items-center gap-2 text-primary">
                                    <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                                    <span className="text-sm font-medium">Loading items...</span>
                                </div>
                            ) : !hasMore && displayedProducts.length > 0 ? (
                                <p className="text-text-secondary text-sm">No more items to load.</p>
                            ) : displayedProducts.length === 0 ? (
                                <p className="text-text-secondary text-base">No items found in this location.</p>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
