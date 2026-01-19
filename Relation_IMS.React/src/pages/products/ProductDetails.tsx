import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import InventoryStockModal from '../../components/products/InventoryStockModal';

// ---------- Interfaces ----------
// Imported from ../../types
import type { Product, InventoryStock, ProductVariant } from '../../types';

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const [productDetail, setProductDetail] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');

    // Inventory Modal State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [stockData, setStockData] = useState<InventoryStock[]>([]);
    const [selectedVariantName, setSelectedVariantName] = useState('');
    const [stockModalMode, setStockModalMode] = useState<'available' | 'defect'>('available');

    useEffect(() => {
        if (id) {
            loadProductDetail(id);
        }
    }, [id]);

    const loadProductDetail = async (productId: string) => {
        try {
            const res = await api.get<Product>(`/Product/${productId}`);
            setProductDetail(res.data);

            if (res.data.ImageUrls && res.data.ImageUrls.length > 0) {
                setSelectedImage(res.data.ImageUrls[0]);
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
        return <div className="p-8 text-center text-gray-500">Loading product details...</div>;
    }

    return (
        <div className="container mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8 flex flex-col gap-6">

            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="flex justify-between items-center">
                <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                    <li className="inline-flex items-center">
                        <Link className="inline-flex items-center text-sm font-medium text-text-secondary hover:text-primary dark:text-gray-400 dark:hover:text-white" to="/dashboard">
                            <span className="material-symbols-outlined text-[18px] mr-1">dashboard</span>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <Link className="ms-1 text-sm font-medium text-text-secondary hover:text-primary md:ms-2 dark:text-gray-400 dark:hover:text-white" to="/products">products</Link>
                        </div>
                    </li>
                    <li aria-current="page">
                        <div className="flex items-center">
                            <span className="material-symbols-outlined text-text-secondary text-[18px]">chevron_right</span>
                            <span className="ms-1 text-sm font-bold text-text-main md:ms-2 dark:text-white">{productDetail.Name}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Left Column: Images */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-4 flex flex-col items-center">
                        <div className="relative w-full aspect-[4/5] bg-gray-50 dark:bg-black/20 rounded-lg overflow-hidden mb-4 group">
                            <div
                                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                                style={{ backgroundImage: `url(${selectedImage})` }}
                            ></div>

                        </div>
                        <div className="flex gap-3 w-full overflow-x-auto pb-2">
                            {productDetail.ImageUrls?.map((image, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImage(image)}
                                    className={`w-16 h-16 shrink-0 rounded-lg border-2 ${selectedImage === image ? 'border-primary' : 'border-gray-200 dark:border-gray-700'} overflow-hidden relative hover:border-primary/50 transition-colors`}
                                >
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${image})` }}></div>
                                </button>
                            ))}
                            <button className="w-16 h-16 shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden relative flex items-center justify-center bg-gray-50 dark:bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/5 transition-all">
                                <span className="material-symbols-outlined">add_a_photo</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stock & Info */}
                <div className="lg:col-span-7 flex flex-col gap-6">

                    {/* Stock Table */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                        <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">inventory_2</span>
                            Stock & Variants
                        </h2>
                        <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-[#2a4032]">
                            <table className="w-full text-sm text-center">
                                <thead>
                                    <tr className="bg-[#4e9767] text-white">
                                        <th className="py-3 px-4 font-bold uppercase text-xs">Color</th>
                                        <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">Size</th>
                                        <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">Quantity</th>
                                        <th className="py-3 px-4 font-bold uppercase text-xs border-l border-white/20">Defects</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-[#112116] divide-y divide-gray-100 dark:divide-[#2a4032]">
                                    {Array.from(groupedVariants).map(([_, variants]) => (
                                        variants.map((variant, idx) => {
                                            const isFirst = idx === 0;
                                            return (
                                                <tr key={variant.Id}>
                                                    {isFirst && (
                                                        <td
                                                            rowSpan={variants.length}
                                                            className="py-3 px-4 border-r border-gray-100 dark:border-[#2a4032]"
                                                        >
                                                            <div className="flex items-center gap-2 justify-center">
                                                                <span
                                                                    className="w-4 h-4 rounded shadow-sm border border-gray-200"
                                                                    style={{ backgroundColor: variant.Color?.HexCode || '#fff' }}
                                                                ></span>
                                                                <span className="font-medium text-text-main dark:text-white">{variant.Color?.Name || 'N/A'}</span>
                                                            </div>
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-4 text-text-main dark:text-gray-300">{variant.Size?.Name || 'N/A'}</td>
                                                    <td className="py-3 px-4">
                                                        <button
                                                            onClick={() => fetchInventoryStock(variant.Id, variant.Color?.Name || '', variant.Size?.Name || '', 'available')}
                                                            className="inline-block px-2 py-1 rounded bg-green-100 text-green-800 text-xs font-bold dark:bg-green-900/40 dark:text-green-300 hover:underline cursor-pointer"
                                                        >
                                                            {variant.Quantity}
                                                        </button>
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

                    {/* Product Header Card */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-text-main dark:text-white tracking-tight">{productDetail.Name}</h1>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wide">
                                    SKU: {productDetail.Id}
                                </span>
                                <span className={`bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-light px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide flex items-center gap-1`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${getStockStatus() ? 'bg-primary' : 'bg-red-500'}`}></span>
                                    {getStockStatus() ? "In Stock" : "Out of Stock"}
                                </span>
                            </div>
                        </div>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm text-text-secondary dark:text-gray-400 font-medium">Retail Price</p>
                            <p className="text-3xl font-black text-text-main dark:text-white">${productDetail.MSRP.toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Product Details Cards */}
                    <div className="bg-white dark:bg-[#1a2e22] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a4032] p-6">
                        <h2 className="text-lg font-bold text-text-main dark:text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">info</span>
                            Product Details
                        </h2>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="block text-xs font-bold uppercase text-text-secondary mb-2 tracking-wide">Description</label>
                                <div className="bg-gray-50 dark:bg-[#112116] p-4 rounded-lg border border-gray-100 dark:border-[#2a4032]">
                                    <p className="text-sm text-text-main dark:text-gray-300 leading-relaxed">
                                        {productDetail.Description}
                                    </p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                    <div className="bg-white dark:bg-[#1a2e22] p-2 rounded-md shadow-sm text-primary">
                                        <span className="material-symbols-outlined text-[20px]">category</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-text-secondary">Category</span>
                                        <span className="text-sm font-bold text-text-main dark:text-white">{productDetail.Category?.Name}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                    <div className="bg-blue-500 text-white p-1 rounded-md shadow-sm shadow-blue-500/20">
                                        <span className="material-symbols-outlined text-[20px]">price_check</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-text-secondary">MSRP</span>
                                        <span className="text-sm font-bold text-text-main dark:text-white">${(productDetail.MSRP || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                    <div className="bg-red-500 text-white p-1 rounded-md shadow-sm shadow-primary/20">
                                        <span className="material-symbols-outlined text-[20px]">attach_money</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-text-secondary">Base Price</span>
                                        <span className="text-sm font-bold text-red-500 dark:text-white">${productDetail.BasePrice.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                    <div className="bg-green-500 text-white p-1 rounded-md shadow-sm shadow-orange-500/20">
                                        <span className="material-symbols-outlined text-[20px]">inventory</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-text-secondary">Cost Price</span>
                                        <span className="text-sm font-bold text-blue-500 dark:text-white">${(productDetail.CostPrice || 0).toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 dark:bg-[#112116] p-3 rounded-lg flex items-center gap-3 border border-gray-100 dark:border-[#2a4032]">
                                    <div className="bg-white dark:bg-[#1a2e22] p-2 rounded-md shadow-sm text-primary">
                                        <span className="material-symbols-outlined text-[20px]">verified</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold uppercase text-text-secondary">Brand</span>
                                        <span className="text-sm font-bold text-text-main dark:text-white">{productDetail.Brand?.Name}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <InventoryStockModal
                show={showInventoryModal}
                onClose={() => setShowInventoryModal(false)}
                stockData={stockData}
                loading={inventoryLoading}
                variantName={selectedVariantName}
                mode={stockModalMode}
            />
        </div>
    );
}
