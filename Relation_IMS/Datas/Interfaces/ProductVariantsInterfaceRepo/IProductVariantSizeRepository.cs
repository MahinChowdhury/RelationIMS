using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo
{
    public interface IProductVariantSizeRepository
    {
        Task<ProductSize?> AddSizeForProductAsync(CreateNewProductSizeDTO productSize);
        Task<ProductSize?> GetProductSizeByIdAsync(int id);
        Task<List<ProductSize>?> GetAllProductSizeByCategoryIdAsync(int categoryId);
        Task<ProductSize?> DeleteProductSizeByIdAsync(int id);
    }
}
