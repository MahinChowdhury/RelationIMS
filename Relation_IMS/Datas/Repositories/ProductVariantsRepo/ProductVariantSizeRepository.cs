using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories.ProductVariantsRepo
{
    public class ProductVariantSizeRepository : IProductVariantSizeRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ProductVariantSizeRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ProductSize?> AddSizeForProductAsync(CreateNewProductSizeDTO productSize)
        {
            if (_context.ProductSizes.Count(x => x.Name == productSize.Name) > 1)
            {
                return null;
            }

            var newSize = _mapper.Map<ProductSize>(productSize);
            newSize.Categories = await _context.Categories
                .Where(c => productSize.CategoryIds.Contains(c.Id))
                .ToListAsync();

            await _context.ProductSizes.AddAsync(newSize);
            await _context.SaveChangesAsync();
            return newSize;
        }

        public async Task<ProductSize?> GetProductSizeByIdAsync(int id)
        {
            var productSize = await _context.ProductSizes
                .Include(s => s.Categories)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (productSize == null)
            {
                return null;
            }

            return productSize;
        }

        public async Task<List<ProductSize>?> GetAllProductSizeByCategoryIdAsync(int categoryId)
        {
            var sizes = await _context.ProductSizes
                .Include(s => s.Categories)
                .Where(s => s.Categories.Any(c => c.Id == categoryId))
                .ToListAsync();
            return sizes;
        }

        public async Task<ProductSize?> DeleteProductSizeByIdAsync(int id)
        {
            var size = await _context.ProductSizes.FindAsync(id);
            if (size == null) return null;

            _context.ProductSizes.Remove(size);
            await _context.SaveChangesAsync();

            return size;
        }

        public async Task<List<ProductSize>?> GetAllSizesAsync()
        {
            return await _context.ProductSizes
                .Include(s => s.Categories)
                .AsNoTracking()
                .ToListAsync();
        }

        public async Task<ProductSize?> UpdateSizeForProductAsync(int id, CreateNewProductSizeDTO productSize)
        {
            var size = await _context.ProductSizes
                .Include(s => s.Categories)
                .FirstOrDefaultAsync(x => x.Id == id);
            if (size == null) return null;

            size.Name = productSize.Name;
            size.Categories = await _context.Categories
                .Where(c => productSize.CategoryIds.Contains(c.Id))
                .ToListAsync();

            await _context.SaveChangesAsync();

            return size;
        }
    }
}
