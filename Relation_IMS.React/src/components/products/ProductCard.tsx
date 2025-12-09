import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
    product: any;
    placeholderImage: string;
    getStockStatus: (id: number) => boolean;
    getCategoryNameById: (id: number) => string;
    getBrandName: (id: number) => string;
    onEdit: (product: any) => void;
    onDelete: (id: number) => void;
}

export default function ProductCard({
    product,
    placeholderImage,
    getStockStatus,
    getCategoryNameById,
    getBrandName,
    onEdit,
    onDelete
}: ProductCardProps) {
    const navigate = useNavigate();

    return (
        <div
            className="relative group rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100/50 hover:border-[#4e9767]/30 hover:-translate-y-2"
            onClick={() => navigate(`/products/${product.Id}`)}
        >
            {/* Subtle shine effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* BIG IMAGE – FULL HEIGHT */}
            <div className="relative w-full aspect-[3/4] overflow-hidden">
                <div
                    className="absolute inset-0 bg-center bg-cover transition-all duration-700 group-hover:scale-110"
                    style={{ backgroundImage: `url(${product.ImageUrls?.[0] || placeholderImage})` }}
                >
                </div>

                {/* IN STOCK BADGE (top-left) */}
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-1 py-0.5 bg-white/50 backdrop-blur-sm text-[#4e9767] text-xs font-bold rounded-full shadow-lg border border-[#4e9767]/20">
                        {getStockStatus(product.Id) ? 'In Stock' : 'Out of Stock'}
                    </span>
                </div>

                {/* FIXED ACTION BUTTONS (top-right) */}
                <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 z-20">
                    {/* Edit */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-blue-50 text-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-blue-100"
                        title="Edit Product">
                        {/* Using simple icons since bx icons might not be setup, converting to svg or text if needed. Angular used bx. I'll assume icons are unavailable and use SVGs from products.html or generic ones */}
                        {/* Angular used <i class="bx bx-edit"></i>. I will replace with equivalent SVG for React to ensure no dependency on external css if possible, but user might have global css. I'll use SVGs to be safe as per "follow design" */}
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </button>

                    {/* Delete */}
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(product.Id); }}
                        className="w-12 h-12 flex items-center justify-center bg-white hover:bg-red-50 text-red-500 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 border-2 border-red-100"
                        title="Delete Product">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>

                {/* OVERLAY TEXT – bottom-left */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white">
                    {/* Category Badge */}
                    <div className="mb-1 sm:mb-2">
                        <span className="inline-block px-2 py-0.5 sm:px-3 sm:py-1 bg-[#4e9767]/80 text-white text-[10px] sm:text-xs md:text-sm font-semibold rounded-full border border-white/30">
                            {getCategoryNameById(product.CategoryId)}
                        </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="text-base sm:text-md md:text-lg font-bold leading-tight line-clamp-2 mb-0.5 sm:mb-1">
                        {product.Name}
                    </h3>

                    {/* Brand */}
                    <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs md:text-sm opacity-90">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="font-medium">{getBrandName(product.BrandId)}</span>
                    </div>
                </div>

            </div>

            {/* Corner glow effect (optional) */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#4e9767]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-full blur-xl"></div>
        </div>
    );
}
