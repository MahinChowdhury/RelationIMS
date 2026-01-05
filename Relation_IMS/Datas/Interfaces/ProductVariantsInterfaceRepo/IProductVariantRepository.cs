using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo
{
    public interface IProductVariantRepository
    {

        //Actual Product Variants
        Task<List<ProductVariant>> GetAllProductVariantsAsync();
        Task<ProductVariant?> GetProductVariantByIdAsync(int id);
        Task<ProductVariant> CreateProductVariantAsync(CreateProductVariantDTO variantDTO);
        Task<ProductVariant?> UpdateProductVariantAsync(int id,UpdateProductVariantDTO variantDTO);
        Task<ProductVariant?> DeleteProductVariantAsync(int id);
        Task<List<ProductVariant>> GetProductVariantsByProductIdAsync(int id);
        Task<List<ProductItem>> AddStockAsync(int variantId, int quantity, int inventoryId);
    }
}