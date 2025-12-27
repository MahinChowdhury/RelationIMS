using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;
using System.Runtime.InteropServices.Marshalling;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IProductItemRepository
    {
        Task<List<ProductItem>> GetAllProductItemsAsync();
        Task<List<ProductItem>> GetAllDefectedProductItemsAsync();
        Task<ProductItem?> GetProductItemByIdAsync(int id);
        Task<ProductItem> CreateProductItemAsync(CreateProductItemDTO itemDto);
        Task<ProductItem?> UpdateProductItemAsync(int id, CreateProductItemDTO itemDto);
        Task<ProductItem?> DeleteProductItemAsync(int id);
        //Task<ProductItem?> DefectProductItemByIdAsync(int id);
        Task<ProductItem?> DefectProductItemByCodeAsync(string code);
    }
}
