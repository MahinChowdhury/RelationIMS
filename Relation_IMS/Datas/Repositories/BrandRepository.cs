using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories
{
    public class BrandRepository : IBrandRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public BrandRepository(ApplicationDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Brand> CreateBrandAsync(CreateBrandDTO brandDTO)
        {
            var brand = _mapper.Map<Brand>(brandDTO);

            await _context.Brands.AddAsync(brand);
            await _context.SaveChangesAsync();

            return brand;
        }

        public async Task<Brand?> DeleteBrandByIdAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return null;

            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();

            return brand;
        }

        public async Task<List<Brand>> GetAllBrandsAsync()
        {
            var brands = await _context.Brands.ToListAsync();

            return brands;
        }

        public async Task<Brand?> GetBrandByIdAsync(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return null;

            return brand;
        }

        public async Task<Brand?> UpdateBrandAsync(int id, CreateBrandDTO brandDTO)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null) return null;

            _mapper.Map(brandDTO, brand);
            await _context.SaveChangesAsync();

            return brand;
        }

        public async Task<List<Brand>> GetBrandsByCategoryIdAsync(int categoryId)
        {
            var brands = await _context.Brands
                .Where(b => b.CategoryId == categoryId)
                .ToListAsync();

            return brands;
        }
    }
}
