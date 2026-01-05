using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo
{
    public interface IProductVariantColorRepository
    {
        Task<ProductColor?> AddColorForProductAsync(CreateNewProductColorDTO productColor);
        Task<ProductColor?> UpdateColorForProductAsync(int id, CreateNewProductColorDTO productColor);
        Task<ProductColor?> GetProductColorByIdAsync(int id);
        Task<List<ProductColor>?> GetAllProductColorAsync();
        Task<ProductColor?> DeleteProductColorByIdAsync(int id);
    }
}