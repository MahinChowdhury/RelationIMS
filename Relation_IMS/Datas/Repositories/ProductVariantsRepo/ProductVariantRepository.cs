using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Factory;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories.ProductVariantsRepo
{
    public class ProductVariantRepository : IProductVariantRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ProductItemsBuilderFactory _factory;

        public ProductVariantRepository(ApplicationDbContext context, IMapper mapper, ProductItemsBuilderFactory factory)
        {
            _context = context;
            _mapper = mapper;
            _factory = factory;
        }

        public async Task<List<ProductVariant>> GetAllProductVariantsAsync()
        {
            var variants = await _context.ProductVariants
                .Include(v => v.ProductItems)
                .ToListAsync();
            return variants;
        }

        public async Task<ProductVariant?> GetProductVariantByIdAsync(int id)
        {
            var variant = await _context.ProductVariants
                .Include(v => v.ProductItems!)
                    .ThenInclude(pi => pi.Inventory)
                .Include(v => v.Color)
                .Include(v => v.Size)
                .Include(v => v.Product)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (variant == null)
            {
                return null;
            }
            return variant;
        }

        public async Task<ProductVariant> CreateProductVariantAsync(CreateProductVariantDTO variantDTO)
        {
            // Step 1: Map DTO → Entity
            var variant = _mapper.Map<ProductVariant>(variantDTO);

            // Step 2: Save the variant first so we get the Variant.Id
            await _context.ProductVariants.AddAsync(variant);
            await _context.SaveChangesAsync();

            // Step 3: Create ProductItems using the factory
            var productItems = _factory.BuildItems(
                productVariantId: variant.Id,
                quantity: variantDTO.Quantity,
                defaultInventoryId: variantDTO.DefaultInventoryId
            );

            // Step 4: Add items to DB
            await _context.ProductItems.AddRangeAsync(productItems);
            await _context.SaveChangesAsync();

            // Step 5: Update Product total quantity
            var product = await _context.Products
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.ProductItems)
                .FirstAsync(x => x.Id == variant.ProductId);

            product.TotalQuantity = product.Variants!
                .Sum(v => v.ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0);

            await _context.SaveChangesAsync();

            return variant;
        }

        public async Task<ProductVariant?> UpdateProductVariantAsync(int id, UpdateProductVariantDTO variantDTO)
        {
            var variant = await _context.ProductVariants.FirstOrDefaultAsync(x => x.Id == id);
            if (variant == null)
            {
                return null;
            }

            variant.ProductColorId = variantDTO.ProductColorId;
            variant.ProductSizeId = variantDTO.ProductSizeId;
            variant.VariantPrice = variantDTO.VariantPrice;

            await _context.SaveChangesAsync();
            return variant;
        }

        public async Task<ProductVariant?> DeleteProductVariantAsync(int id)
        {
            var variant = await _context.ProductVariants
                .Include(v => v.ProductItems)
                .FirstOrDefaultAsync(v => v.Id == id);

            if (variant == null)
            {
                return null;
            }

            var product = await _context.Products
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.ProductItems)
                .FirstOrDefaultAsync(x => x.Id == variant.ProductId);

            if (product != null)
            {
                _context.ProductVariants.Remove(variant);
                await _context.SaveChangesAsync();

                // Recalculate product total quantity
                product.TotalQuantity = product.Variants!
                    .Where(v => v.Id != id) // Exclude the deleted variant
                    .Sum(v => v.ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0);

                await _context.SaveChangesAsync();
            }

            return variant;
        }

        public async Task<List<ProductVariant>> GetProductVariantsByProductIdAsync(int id)
        {
            var variants = await _context.ProductVariants
                .Include(v => v.ProductItems!)
                    .ThenInclude(pi => pi.Inventory)
                .Include(v => v.Color)
                .Include(v => v.Size)
                .Where(p => p.ProductId == id)
                .ToListAsync();
            return variants;
        }

        public async Task<List<ProductItem>> AddStockAsync(int variantId, int quantity, int inventoryId)
        {
            var variant = await _context.ProductVariants.FindAsync(variantId);
            if (variant == null) return new List<ProductItem>();

            // Use factory to build new items with unique codes
            var productItems = _factory.BuildItems(
                productVariantId: variantId,
                quantity: quantity,
                defaultInventoryId: inventoryId
            );

            await _context.ProductItems.AddRangeAsync(productItems);
            await _context.SaveChangesAsync();

            // Update Product Total Quantity
            var product = await _context.Products
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.ProductItems)
                .FirstOrDefaultAsync(x => x.Id == variant.ProductId);

            if (product != null)
            {
                product.TotalQuantity = product.Variants!
                    .Sum(v => v.ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0);
                await _context.SaveChangesAsync();
            }

            return productItems;
        }
    }
}