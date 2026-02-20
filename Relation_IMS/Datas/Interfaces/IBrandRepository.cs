using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IBrandRepository
    {
        Task<List<Brand>> GetAllBrandsAsync();
        Task<Brand?>GetBrandByIdAsync(int id);
        Task<Brand?> DeleteBrandByIdAsync(int id);
        Task<Brand> CreateBrandAsync(CreateBrandDTO brandDTO);
        Task<Brand?> UpdateBrandAsync(int id, CreateBrandDTO brandDTO);
        Task<List<Brand>> GetBrandsByCategoryIdAsync(int categoryId);
    }
}
