using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IBrandRepository
    {
        Task<List<Brand>> GetAllBrandsAsync();
        Task<Brand?>GetBrandByIdAsync(int id);
        Task<Brand?> DeleteBrandByIdAsync(int id);
        Task<Brand> CreateBrandAsync(CreateBrandDTO brandDTO);
    }
}
