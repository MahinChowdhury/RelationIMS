using Relation_IMS.Dtos.CategoryDtos;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Interfaces
{
    public interface ICategoryRepository
    {
        Task<List<Category>> GetAllCategoryAsync();
        Task<Category?> GetCategoryByIdAsync(int id);
        Task<Category?> CreateCategoryAsync(CreateCategoryDTO createCategoryDTO);
        Task<Category?> UpdateCategoryAsync(int id,UpdateCategoryDTO updateCategoryDTO);
        Task<Category?> DeleteCategoryAsync(int id);
    }
}
