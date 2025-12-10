
import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import InventoryStockModal from '../../components/products/InventoryStockModal';
import type { InventoryStock } from '../../types';

// ---------- Interfaces ----------
interface Color {
    Id: number;
    Name: string;
    HexCode: string;
}
interface Size {
    Id: number;
    Name: string;
    CategoryId: number;
}
interface Brand {
    Id: number;
    Name: string;
}
interface Variant {
    Id: number;
    ProductId: number;
    ProductColorId: number;
    ProductSizeId: number;
    Quantity: number;
    Defects: number;
    VariantPrice: number;
    Color?: Color;
    Size?: Size;
}
interface Category {
    Id: number;
    Name: string;
    Description: string;
}
interface Product {
    Id: number;
    Name: string;
    Description: string;
    BasePrice: number;
    CategoryId: number;
    Category: Category;
    TotalQuantity: number;
    BrandId: number;
    Brand: Brand;
    ImageUrls: string[];
    Variants: Variant[];
}

export default function ProductDetails() {
    const { id } = useParams<{ id: string }>();
    const [productDetail, setProductDetail] = useState<Product | null>(null);
    const [selectedImage, setSelectedImage] = useState<string>('');

    // Inventory Modal State
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [stockData, setStockData] = useState<InventoryStock[]>([]);
    const [selectedVariantName, setSelectedVariantName] = useState('');

    // const [editingStockIndex, setEditingStockIndex] = useState<number | null>(null);
    // const [editedStock, setEditedStock] = useState<{ quantity: number }>({ quantity: 0 });

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

    const fetchInventoryStock = async (variantId: number, colorName: string, sizeName: string) => {
        setInventoryLoading(true);
        setStockData([]);
        setSelectedVariantName(`${colorName} - ${sizeName}`);
        setShowInventoryModal(true);

        try {
            console.log(`Fetching inventory for variantId: ${variantId}`);
            // Explicitly override baseURL to remove /v1 as per user provided endpoint
            const res = await api.get<InventoryStock[]>(`/Inventory/variant/${variantId}/stock`, {
                baseURL: 'https://localhost:7062/api'
            });
            setStockData(res.data);
        } catch (err) {
            console.error('Failed to load inventory stock:', err);
        } finally {
            setInventoryLoading(false);
        }
    };

    // const editStockRow = (index: number, variant: Variant) => {
    //     setEditingStockIndex(index);
    //     setEditedStock({ quantity: variant.Quantity });
    // };

    // const cancelStockEdit = () => {
    //     setEditingStockIndex(null);
    // };

    // const saveEditedStock = async (index: number) => {
    //     if (!productDetail || editedStock.quantity < 0) return;

    //     const updatedVariants = [...productDetail.Variants];
    //     const prevQuantity = updatedVariants[index].Quantity;
    //     // updatedVariants[index].Quantity = editedStock.quantity;

    //     // Optimistic update
    //     setProductDetail({ ...productDetail, Variants: updatedVariants });

    //     try {
    //         const variantsPayload = updatedVariants.map(v => ({
    //             Id: v.Id ?? 0,
    //             ProductId: productDetail.Id,
    //             ProductColorId: v.ProductColorId,
    //             ProductSizeId: v.ProductSizeId,
    //             Quantity: v.Quantity,
    //             VariantPrice: productDetail.BasePrice,
    //         }));

    //         const finalImageUrls = Array.isArray(productDetail.ImageUrls)
    //             ? [...productDetail.ImageUrls]
    //             : [];

    //         const requestBody = {
    //             Name: productDetail.Name,
    //             Description: productDetail.Description,
    //             BasePrice: productDetail.BasePrice,
    //             CategoryId: productDetail.CategoryId,
    //             BrandId: productDetail.BrandId,
    //             ImageUrls: finalImageUrls,
    //             Variants: variantsPayload,
    //         };

    //         await api.put(`/Product/${productDetail.Id}`, requestBody);

    //         console.log('✅ Stock updated successfully:', requestBody);
    //         // setEditingStockIndex(null);
    //     } catch (err) {
    //         // Rollback
    //         updatedVariants[index].Quantity = prevQuantity;
    //         setProductDetail({ ...productDetail, Variants: updatedVariants });
    //         console.error('❌ Failed to update stock:', err);
    //     }
    // };

    const getStockStatus = () => {
        return (productDetail?.TotalQuantity ?? 0) > 0;
    };

    // Group variants by Color ID
    const groupedVariants = useMemo(() => {
        if (!productDetail?.Variants) return new Map<number | undefined, Variant[]>();

        const map = new Map<number | undefined, Variant[]>();
        for (const item of productDetail.Variants) {
            const key = item.Color?.Id;
            const group = map.get(key) ?? [];
            group.push(item);
            map.set(key, group);
        }
        return map;
    }, [productDetail]);

    // Helper to find original index of a variant
    // const getVariantIndex = (variantId: number) => {
    //     return productDetail?.Variants.findIndex(v => v.Id === variantId) ?? -1;
    // };


    if (!productDetail) {
        return <div className="p-8 text-center text-gray-500">Loading product details...</div>;
    }

    return (
        <div className="px-4 md:px-8 lg:px-16 xl:px-32 flex flex-1 justify-center py-5 bg-gradient-to-br from-[#f8fcf9] to-white min-h-screen">
            <div className="layout-content-container flex flex-col w-full max-w-[1600px]">

                {/* Breadcrumb */}
                <div className="flex flex-wrap gap-2 p-4 text-sm md:text-base">
                    <Link className="text-[rgb(78,151,103)] font-semibold cursor-pointer hover:text-[#3d7a52] transition-colors" to="/products">Products</Link>
                    <span className="text-[#4e9767] font-medium">/</span>
                    <span className="text-[#0e1b12] font-semibold">{productDetail.Name}</span>
                </div>

                {/* MAIN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 p-4">

                    {/* LEFT: PRODUCT IMAGES (40%) */}
                    <div className="lg:col-span-5 w-full">
                        <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 border border-gray-100 lg:sticky lg:top-4">
                            {/* Main Image */}
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-square bg-gradient-to-br from-gray-50 to-gray-100 mb-4 md:mb-6 w-full">
                                <div
                                    className="w-full h-full bg-center bg-contain bg-no-repeat"
                                    style={{ backgroundImage: `url(${selectedImage})` }}
                                ></div>
                                <div className="absolute top-0 right-0 w-16 h-16 md:w-20 md:h-20 bg-gradient-to-bl from-[#4e9767]/20 to-transparent"></div>
                            </div>

                            {/* Thumbnails */}
                            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 hide-scrollbar">
                                {productDetail.ImageUrls?.map((image, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => setSelectedImage(image)}
                                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg md:rounded-xl overflow-hidden shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${selectedImage === image ? 'ring-2 md:ring-4 ring-[#4e9767] opacity-100' : 'opacity-50'}`}
                                    >
                                        <div
                                            className="w-full h-full bg-center bg-cover bg-no-repeat"
                                            style={{ backgroundImage: `url(${image})` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: STOCK TABLE (60%) */}
                    <div className="lg:col-span-7 w-full">
                        <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 border border-gray-100">
                            <h3 className="text-[#0e1b12] text-2xl md:text-3xl font-black mb-4 md:mb-8 flex items-center gap-3">
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                Stock & Variants
                            </h3>

                            {/* Mobile Table */}
                            <div className="md:hidden space-y-6">
                                {Array.from(groupedVariants).map(([colorId, variants]) => (
                                    <div key={colorId ?? 'unknown'} className="rounded-2xl border-2 border-[#d0e7d7] overflow-hidden shadow-lg bg-white">
                                        <div className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52] px-4 py-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="inline-block w-8 h-8 rounded-lg border-2 border-white shadow-md flex-shrink-0"
                                                    style={{ backgroundColor: variants[0].Color?.HexCode || '#fff' }}
                                                ></span>
                                                <span className="text-white font-bold text-base">{variants[0].Color?.Name || 'N/A'}</span>
                                            </div>
                                            <span className="text-white font-bold text-lg">${variants[0].VariantPrice}</span>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-[#f8fcf9] border-b-2 border-[#d0e7d7]">
                                                        <th className="px-3 py-2 text-left text-[#4e9767] text-xs font-bold uppercase border-r border-[#d0e7d7]">Size</th>
                                                        <th className="px-3 py-2 text-center text-[#4e9767] text-xs font-bold uppercase border-r border-[#d0e7d7]">Qty</th>
                                                        <th className="px-3 py-2 text-center text-[#4e9767] text-xs font-bold uppercase">Defects</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {variants.map((variant, idx) => {
                                                        // const originalIndex = getVariantIndex(variant.Id);
                                                        const isLast = idx === variants.length - 1;
                                                        return (
                                                            <tr key={variant.Id} className={`hover:bg-[#f8fcf9] transition-colors ${!isLast ? 'border-b border-[#d0e7d7]' : ''}`}>
                                                                <td className="px-3 py-3 text-[#0e1b12] font-semibold text-sm border-r border-[#d0e7d7]">
                                                                    {variant.Size?.Name || 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-3 text-center border-r border-[#d0e7d7]">
                                                                    <button
                                                                        onClick={() => fetchInventoryStock(variant.Id, variant.Color?.Name || 'N/A', variant.Size?.Name || 'N/A')}
                                                                        className="px-2.5 py-1 bg-[#e7f3eb] text-[#4e9767] rounded-lg inline-block font-bold text-sm cursor-pointer hover:bg-[#d0e7d7] transition-colors"
                                                                    >
                                                                        {variant.Quantity}
                                                                    </button>
                                                                </td>
                                                                <td className="px-3 py-3 text-center">
                                                                    <span className="px-2.5 py-1 bg-[#fde7e7] text-[#d9534f] rounded-lg inline-block font-bold text-sm">
                                                                        {variant.Defects}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table */}
                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#d0e7d7] shadow-lg">
                                <table className="w-full min-w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-[#4e9767] to-[#3d7a52]">
                                            <th className="border border-[#d0e7d7] px-4 py-4 text-left text-white text-sm lg:text-base font-bold uppercase">Color</th>
                                            <th className="border border-[#d0e7d7] px-4 py-4 text-center text-white text-sm lg:text-base font-bold uppercase">Size</th>
                                            <th className="border border-[#d0e7d7] px-4 py-4 text-center text-white text-sm lg:text-base font-bold uppercase">Quantity</th>
                                            <th className="border border-[#d0e7d7] px-4 py-4 text-center text-white text-sm lg:text-base font-bold uppercase">Defects</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white">
                                        {Array.from(groupedVariants).map(([_, variants]) =>
                                            variants.map((variant, idx) => {
                                                // const originalIndex = getVariantIndex(variant.Id);
                                                const isFirst = idx === 0;
                                                return (
                                                    <tr key={variant.Id} className="hover:bg-[#f8fcf9] transition-colors">
                                                        {isFirst && (
                                                            <td
                                                                rowSpan={variants.length}
                                                                className="border border-[#d0e7d7] px-4 py-4 align-middle bg-gradient-to-br from-[#f8fcf9] to-white"
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    <span
                                                                        className="inline-block w-10 h-10 rounded-lg border-2 border-gray-300 shadow-sm flex-shrink-0"
                                                                        style={{ backgroundColor: variant.Color?.HexCode || '#fff' }}
                                                                    ></span>
                                                                    <span className="font-bold text-[#0e1b12] text-sm lg:text-base">{variant.Color?.Name || 'N/A'}</span>
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className="border border-[#d0e7d7] px-4 py-4 text-center text-[#0e1b12] font-semibold text-sm lg:text-base">
                                                            {variant.Size?.Name || 'N/A'}
                                                        </td>
                                                        <td className="border border-[#d0e7d7] px-4 py-4 text-center">
                                                            <button
                                                                onClick={() => fetchInventoryStock(variant.Id, variant.Color?.Name || 'N/A', variant.Size?.Name || 'N/A')}
                                                                className="px-2.5 py-1 bg-[#e7f3eb] text-[#4e9767] rounded-lg inline-block font-bold text-sm cursor-pointer hover:bg-[#d0e7d7] transition-colors"
                                                            >
                                                                {variant.Quantity}
                                                            </button>
                                                        </td>
                                                        <td className="border border-[#d0e7d7] px-4 py-4 text-center">
                                                            <span className="px-3 py-1.5 bg-[#fde7e7] text-[#d9534f] rounded-lg inline-block font-bold text-sm lg:text-base">
                                                                {variant.Defects}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* PRODUCT INFO */}
                <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6 border border-gray-100 mx-4">
                    <p className="text-[#0e1b12] text-xl md:text-2xl lg:text-4xl font-black leading-tight mb-2">
                        {productDetail.Name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 md:gap-3">
                        <span className="px-2 md:px-3 py-1 bg-[#e7f3eb] text-[#4e9767] text-xs md:text-sm font-bold rounded-full">
                            SKU: {productDetail.Id}
                        </span>
                        <span className="px-2 md:px-3 py-1 bg-gradient-to-r from-[#4e9767] to-[#3d7a52] text-white text-xs md:text-sm font-bold rounded-full shadow-md">
                            {getStockStatus() ? "In Stock" : "Out of Stock"}
                        </span>
                    </div>
                </div>

                <div className="p-4 mt-2">
                    <div className="bg-white rounded-3xl shadow-xl p-4 md:p-8 border border-gray-100">
                        <h3 className="text-[#0e1b12] text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 md:w-6 md:h-6 text-[#4e9767]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Product Details
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                            {/* Description */}
                            <div className="sm:col-span-2 lg:col-span-4 space-y-2">
                                <p className="text-[#4e9767] text-xs md:text-sm font-bold uppercase tracking-wide">Description</p>
                                <p className="text-[#0e1b12] text-sm md:text-base leading-relaxed bg-[#f8fcf9] p-3 md:p-4 rounded-xl">
                                    {productDetail.Description}
                                </p>
                            </div>

                            {/* Category */}
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#e7f3eb] rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#4e9767]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#4e9767] text-xs md:text-sm font-bold uppercase">Category</p>
                                    <p className="text-[#0e1b12] text-base md:text-lg font-semibold mt-1 break-words">{productDetail.Category?.Name}</p>
                                </div>
                            </div>

                            {/* Price */}
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-[#4e9767] to-[#3d7a52] rounded-xl flex items-center justify-center shadow-lg">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#4e9767] text-xs md:text-sm font-bold uppercase">Base Price</p>
                                    <p className="text-[#0e1b12] text-2xl md:text-3xl font-black mt-1">${productDetail.BasePrice}</p>
                                </div>
                            </div>

                            {/* Brand */}
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 bg-[#e7f3eb] rounded-xl flex items-center justify-center">
                                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#4e9767]" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#4e9767] text-xs md:text-sm font-bold uppercase">Brand</p>
                                    <p className="text-[#0e1b12] text-base md:text-lg font-semibold mt-1 break-words">{productDetail.Brand?.Name}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* Styles for hiding scrollbar */}
            <style>
                {`
                .hide-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                `}
            </style>

            <InventoryStockModal
                show={showInventoryModal}
                onClose={() => setShowInventoryModal(false)}
                stockData={stockData}
                loading={inventoryLoading}
                variantName={selectedVariantName}
            />
        </div>
    );
}

