using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IProductRepository
    {
        Task<List<Product>> GetAllProductsAsync(string? search, string? sortBy, string? stockOrder, int brandId, int categoryId,int pageNumber,int pageSize);
        Task<Product?> GetProductByIdAsync(int id);
        Task<Product?> DeleteProductByIdAsync(int id);
        Task<Product?> CreateProductAsync(CreateNewProductDTO productDto);
        Task<Product?> UpdateProductByIdAsync(int id,UpdateProductDTO updateDto);
    }
}
