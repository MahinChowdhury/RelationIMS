using AutoMapper;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CategoryDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories
{
    public class CategoryRepository : ICategoryRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public CategoryRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }
        public async Task<Category?> CreateCategoryAsync(CreateCategoryDTO createCategoryDTO)
        {
            // Check if category name already exists (case-insensitive)
            var existingCategory = await _context.Categories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == createCategoryDTO.Name.ToLower());

            if (existingCategory != null)
            {
                return null;
            }

            var newCategory = _mapper.Map<Category>(createCategoryDTO);

            await _context.Categories.AddAsync(newCategory);
            await _context.SaveChangesAsync();

            return newCategory;
        }

        public async Task<Category?> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return null;
            }

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return category;
        }

        public async Task<List<Category>> GetAllCategoryAsync()
        {
            return await _context.Categories.ToListAsync();
        }

        public async Task<Category?> GetCategoryByIdAsync(int id)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);

            if (category == null) {
                return null;
            }

            return category;
        }

        public async Task<Category?> UpdateCategoryAsync(int id,UpdateCategoryDTO updateCategoryDTO)
        {
            var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);

            if (category == null)
            {
                return null;
            }

            category.Description = updateCategoryDTO.Description;
            category.Name = updateCategoryDTO.Name;

            await _context.SaveChangesAsync();

            return category;
        }
    }
}