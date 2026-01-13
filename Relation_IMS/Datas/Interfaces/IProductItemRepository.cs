using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;
using System.Runtime.InteropServices.Marshalling;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IProductItemRepository
    {
        Task<List<ProductItem>> GetAllProductItemsAsync();
        Task<List<DefectItemResDTO>> GetAllDefectedProductItemsAsync();
        Task<ProductItem?> GetProductItemByIdAsync(int id);
        Task<ProductItemResponseDTO?> GetProductItemByCodeAsync(string code);
        Task<ProductItem> CreateProductItemAsync(CreateProductItemDTO itemDto);
        Task<ProductItem?> UpdateProductItemAsync(int id, CreateProductItemDTO itemDto);
        Task<ProductItem?> DeleteProductItemAsync(int id);
        //Task<ProductItem?> DefectProductItemByIdAsync(int id);
        Task<DefectItemResDTO?> DefectProductItemByCodeAsync(string code, DefectRequestDTO defectDto, int? userId);
    }
}
