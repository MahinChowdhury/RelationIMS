import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
    product: any;
    placeholderImage: string;
    getStockStatus: (id: number) => boolean;
    getCategoryNameById: (id: number) => string;
    getBrandName: (id: number) => string;
    gridDensity?: 4 | 6 | 8;
    onEdit?: (product: any) => void;
    onDelete?: (id: number) => void;
    onCardClick?: (id: number) => void;
    isGuestView?: boolean;
}

export default function ProductCard({
    product,
    placeholderImage,
    getCategoryNameById,
    getBrandName,
    gridDensity,
    onCardClick,
    isGuestView
}: ProductCardProps) {
    const navigate = useNavigate();

    const quantity = product.TotalQuantity || 0;

    const stockDot = !isGuestView ? (
        quantity === 0
            ? <span className="inline-block w-[6px] h-[6px] rounded-full bg-red-500 shrink-0" title="Out of stock" />
            : quantity < 10
                ? <span className="inline-block w-[6px] h-[6px] rounded-full bg-amber-500 shrink-0" title="Low stock" />
                : <span className="inline-block w-[6px] h-[6px] rounded-full bg-emerald-500 shrink-0" title="In stock" />
    ) : null;

    return (
        <div
            className="group relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm md:hover:shadow-lg md:hover:shadow-green-900/10 transition-all duration-300 border border-gray-100 dark:border-[#2a4032] cursor-pointer flex flex-col"
            onClick={(e) => {
                e.stopPropagation();
                if (onCardClick) {
                    onCardClick(product.Id);
                } else {
                    navigate(`/products/${product.Id}`);
                }
            }}
        >
            {/* Image */}
            <div className="relative aspect-[4/5] w-full overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 md:group-hover:scale-[1.03]"
                    style={{ backgroundImage: `url('${product.ThumbnailUrl || product.ImageUrls?.[0] || placeholderImage}')` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-50 md:group-hover:opacity-70 transition-opacity"></div>
            </div>

            {/* Info Section */}
            {(gridDensity ?? 4) === 4 ? (
                /* ── Grid-4: always single-line ── */
                <div className="flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-[#1a2e22] border-t border-gray-100 dark:border-[#2a4032] min-w-0">
                    {stockDot}
                    <span className="text-[9px] sm:text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                        {product.Name}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                    <span className="shrink-0 text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[30%]">
                        {getCategoryNameById(product.CategoryId)}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                    <span className="shrink-0 text-[8px] sm:text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[20%]">
                        {getBrandName(product.BrandId)}
                    </span>
                    <span className="text-[8px] sm:text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                    <span className="shrink-0 text-[8px] sm:text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {product.Sku || product.Id}
                    </span>
                </div>
            ) : gridDensity === 6 ? (
                /* ── Grid-6: single-line on sm+, two-line on mobile ── */
                <>
                    {/* Mobile: two-line */}
                    <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white dark:bg-[#1a2e22] border-t border-gray-100 dark:border-[#2a4032] sm:hidden">
                        <div className="flex items-center gap-1 min-w-0">
                            {stockDot}
                            <span className="text-[9px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                                {product.Name}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 min-w-0">
                            <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate">
                                {getCategoryNameById(product.CategoryId)}
                            </span>
                            <span className="text-[7px] text-gray-300 dark:text-gray-600">·</span>
                            <span className="text-[8px] text-gray-500 dark:text-gray-400 truncate">
                                {getBrandName(product.BrandId)}
                            </span>
                            <span className="text-[7px] text-gray-300 dark:text-gray-600">·</span>
                            <span className="shrink-0 text-[8px] text-gray-400 dark:text-gray-500 font-mono">
                                {product.Sku || product.Id}
                            </span>
                        </div>
                    </div>
                    {/* Desktop: single-line */}
                    <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-white dark:bg-[#1a2e22] border-t border-gray-100 dark:border-[#2a4032] min-w-0">
                        {stockDot}
                        <span className="text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                            {product.Name}
                        </span>
                        <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span className="shrink-0 text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[30%]">
                            {getCategoryNameById(product.CategoryId)}
                        </span>
                        <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span className="shrink-0 text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[20%]">
                            {getBrandName(product.BrandId)}
                        </span>
                        <span className="text-[9px] text-gray-300 dark:text-gray-600 shrink-0">·</span>
                        <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                            {product.Sku || product.Id}
                        </span>
                    </div>
                </>
            ) : (
                /* ── Grid-8: always two-line ── */
                <div className="flex flex-col gap-0.5 px-2 py-1.5 bg-white dark:bg-[#1a2e22] border-t border-gray-100 dark:border-[#2a4032]">
                    <div className="flex items-center gap-1 min-w-0">
                        {stockDot}
                        <span className="text-[10px] sm:text-[11px] font-semibold text-gray-800 dark:text-gray-100 truncate leading-tight">
                            {product.Name}
                        </span>
                    </div>
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400 truncate">
                            {getCategoryNameById(product.CategoryId)}
                        </span>
                        <span className="text-[7px] sm:text-[8px] text-gray-300 dark:text-gray-600">·</span>
                        <span className="text-[8px] sm:text-[9px] text-gray-500 dark:text-gray-400 truncate">
                            {getBrandName(product.BrandId)}
                        </span>
                        <span className="text-[7px] sm:text-[8px] text-gray-300 dark:text-gray-600">·</span>
                        <span className="shrink-0 text-[8px] sm:text-[9px] text-gray-400 dark:text-gray-500 font-mono">
                            {product.Sku || product.Id}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
