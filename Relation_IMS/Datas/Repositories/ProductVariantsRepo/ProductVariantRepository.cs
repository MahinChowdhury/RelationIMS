using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories.ProductVariantsRepo
{
    public class ProductVariantRepository : IProductVariantRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ProductVariantRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<ProductVariant>> GetAllProductVariantsAsync()
        {
            var variants = await _context.ProductVariants.ToListAsync();
            return variants;
        }

        public async Task<ProductVariant?> GetProductVariantByIdAsync(int id)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(s => s.Id == id);
            if (variant == null) {
                return null;
            }

            return variant;
        }

        public async Task<ProductVariant> CreateProductVariantAsync(CreateProductVariantDTO variantDTO)
        {
            var variant = _mapper.Map<ProductVariant>(variantDTO);

            await _context.ProductVariants.AddAsync(variant);
            
            await _context.SaveChangesAsync();

            var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == variant.ProductId);
            product!.TotalQuantity += variant.Quantity;
            await _context.SaveChangesAsync();

            return variant;
        }

        public async Task<ProductVariant?> UpdateProductVariantAsync(int id,UpdateProductVariantDTO variantDTO)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(x=>x.Id == id);

            if (variant == null) {
                return null;
            }

            variant.ProductColorId = variantDTO.ProductColorId;
            variant.ProductSizeId = variantDTO.ProductSizeId;
            variant.VariantPrice = variantDTO.VariantPrice;
            variant.Quantity = variantDTO.Quantity;

            return variant;

        }

        public async Task<ProductVariant?> DeleteProductVariantAsync(int id)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(v => v.Id == id);
            if (variant == null) {
                return null;
            }

            var product = await _context.Products.FirstOrDefaultAsync(x => x.Id == variant.ProductId);
            product!.TotalQuantity -= variant.Quantity;

            _context.ProductVariants.Remove(variant);

            await _context.SaveChangesAsync();

            return variant;
        }

        public async Task<List<ProductVariant>> GetProductVariantsByProductIdAsync(int id)
        {
            var variants = await _context.ProductVariants.Where(p => p.ProductId == id).ToListAsync();

            return variants;
        }
    }
}