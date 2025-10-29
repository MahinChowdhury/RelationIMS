using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories.ProductVariantsRepo
{
    public class ProductVariantColorRepository : IProductVariantColorRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ProductVariantColorRepository(ApplicationDbContext context,IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<ProductColor?> AddColorForProductAsync(CreateNewProductColorDTO productColor)
        {
            if (_context.ProductColors.Count(x => x.Name == productColor.Name) > 1)
            {
                return null;
            }

            var newColor = _mapper.Map<ProductColor>(productColor);
            await _context.ProductColors.AddAsync(newColor);
            await _context.SaveChangesAsync();

            return newColor;
        }
        public async Task<ProductColor?> GetProductColorByIdAsync(int id)
        {
            var productColor = await _context.ProductColors.FirstOrDefaultAsync(x => x.Id == id);
            if (productColor == null)
            {
                return null;
            }

            return productColor;
        }
        public async Task<List<ProductColor>?> GetAllProductColorAsync()
        {
            var colors = await _context.ProductColors.ToListAsync();

            return colors;
        }

        public async Task<ProductColor?> DeleteProductColorByIdAsync(int id)
        {
            var color = await _context.ProductColors.FirstOrDefaultAsync(c => c.Id == id);
            if(color == null) return null;

            _context.ProductColors.Remove(color);
            await _context.SaveChangesAsync();

            return color;
        }
    }
}
