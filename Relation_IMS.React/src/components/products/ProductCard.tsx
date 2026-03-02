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
}

export default function ProductCard({
    product,
    placeholderImage,
    getCategoryNameById,
    getBrandName,
    gridDensity,
}: ProductCardProps) {
    const navigate = useNavigate();

    const quantity = product.TotalQuantity || 0;

    let statusBadge;
    if (quantity === 0) {
        statusBadge = (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-gray-200/90 text-gray-600 backdrop-blur-md shadow-sm">
                No Stock
            </span>
        );
    } else if (quantity < 10) {
        statusBadge = (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-yellow-100/90 text-yellow-800 backdrop-blur-md shadow-sm">
                Low Stock
            </span>
        );
    }

    return (
        <div
            className="group relative w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-lg hover:shadow-green-900/10 transition-all duration-300 border border-gray-100 dark:border-[#2a4032] cursor-pointer flex flex-col"
            onClick={() => navigate(`/products/${product.Id}`)}
        >
            {/* Image */}
            <div className="relative aspect-[3/4] w-full overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${product.ImageUrls?.[0] || placeholderImage})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                
                <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                    {statusBadge && statusBadge}
                </div>
            </div>

            {/* Info - Single Line Below Image */}
            <div className="flex items-center gap-1.5 px-2 py-2 bg-white dark:bg-[#1a2e22] border-t border-gray-100 dark:border-[#2a4032]">
                {gridDensity !== 8 && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-white">
                        {getCategoryNameById(product.CategoryId)}
                    </span>
                )}
                <span className="text-[10px] sm:text-xs font-bold text-text-main dark:text-white truncate">
                    {product.Name}
                </span>
                <span className="shrink-0 text-[10px] sm:text-xs text-gray-500 truncate">
                    | {getBrandName(product.BrandId)}
                </span>
            </div>
        </div>
    );
}
