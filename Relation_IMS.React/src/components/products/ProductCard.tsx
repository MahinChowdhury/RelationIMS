import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
    product: any;
    placeholderImage: string;
    getStockStatus: (id: number) => boolean;
    getCategoryNameById: (id: number) => string;
    getBrandName: (id: number) => string;
    onEdit?: (product: any) => void;
    onDelete?: (id: number) => void;
}

export default function ProductCard({
    product,
    placeholderImage,
    getStockStatus,
    getCategoryNameById,
    getBrandName
}: ProductCardProps) {
    const navigate = useNavigate();

    // Simple logic for low stock simulation or could be passed in. 
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
    } else {
        statusBadge = (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-white/90 text-green-700 backdrop-blur-md shadow-sm">
                In Stock
            </span>
        );
    }

    return (
        <div
            className="group relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm hover:shadow-lg hover:shadow-green-900/10 transition-all duration-300 border border-gray-100 dark:border-[#2a4032] cursor-pointer"
            onClick={() => navigate(`/products/${product.Id}`)}
        >
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${product.ImageUrls?.[0] || placeholderImage})` }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                {statusBadge}
            </div>

            <div className="absolute bottom-0 left-0 w-full p-3 sm:p-4 flex flex-col gap-0.5 sm:gap-1 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                <span className="self-start px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-primary text-white mb-0.5">
                    {getCategoryNameById(product.CategoryId)}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-white leading-tight line-clamp-2">
                    {product.Name}
                </h3>
                <div className="flex items-center gap-1 text-gray-300 text-[10px] sm:text-xs">
                    <span className="material-symbols-outlined text-[12px] text-yellow-400 fill-1" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="truncate">{getBrandName(product.BrandId)}</span>
                </div>
            </div>
        </div>
    );
}
