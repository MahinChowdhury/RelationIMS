using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces.ProductVariantsInterfaceRepo;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Factory;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;

namespace Relation_IMS.Datas.Repositories.ProductVariantsRepo
{
    public class ProductVariantRepository : IProductVariantRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ProductItemsBuilderFactory _factory;
        private readonly ProductCodeGenerator _codeGenerator;

        public ProductVariantRepository(ApplicationDbContext context, IMapper mapper, ProductItemsBuilderFactory factory, ProductCodeGenerator codeGenerator)
        {
            _context = context;
            _mapper = mapper;
            _factory = factory;
            _codeGenerator = codeGenerator;
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

            // Step 3: Get product and its code for item generation
            var product = await _context.Products
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == variant.ProductId);
            
            if (product == null)
                throw new InvalidOperationException($"Product with ID {variant.ProductId} not found");
            
            // Ensure product has a code
            if (string.IsNullOrEmpty(product.Code))
            {
                var category = product.Category ?? await _context.Categories.FindAsync(product.CategoryId);
                if (category != null)
                {
                    if (string.IsNullOrEmpty(category.Code))
                    {
                        category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
                    }
                    product.Code = _codeGenerator.GenerateProductCode(category.Code, product.Id);
                }
            }

            // Step 4: Create ProductItems using the factory with "0000" for no lot
            var productItems = _factory.BuildItems(
                productCode: product.Code!,
                lotCode: "0000",
                variantId: variant.Id,
                quantity: variantDTO.Quantity,
                defaultInventoryId: variantDTO.DefaultInventoryId,
                productLotId: null
            );

            // Step 5: Add items to DB
            await _context.ProductItems.AddRangeAsync(productItems);
            await _context.SaveChangesAsync();

            // Step 6: Update Product total quantity
            // Reload product with variants to get updated counts
            await _context.Entry(product).Collection(p => p.Variants!).LoadAsync();
            foreach (var v in product.Variants!)
            {
                await _context.Entry(v).Collection(x => x.ProductItems!).LoadAsync();
            }

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
            var variant = await _context.ProductVariants
                .Include(v => v.Product)
                    .ThenInclude(p => p!.Category)
                .FirstOrDefaultAsync(v => v.Id == variantId);
            
            if (variant == null) return new List<ProductItem>();

            // Ensure product has a code
            if (string.IsNullOrEmpty(variant.Product?.Code))
            {
                var prod = variant.Product;
                if (prod != null)
                {
                    var category = prod.Category ?? await _context.Categories.FindAsync(prod.CategoryId);
                    if (category != null)
                    {
                        if (string.IsNullOrEmpty(category.Code))
                        {
                            category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
                        }
                        prod.Code = _codeGenerator.GenerateProductCode(category.Code, prod.Id);
                        await _context.SaveChangesAsync();
                    }
                }
            }

            // Use factory to build new items with unique codes (no lot = "0000")
            var productItems = _factory.BuildItems(
                productCode: variant.Product!.Code!,
                lotCode: "0000",
                variantId: variantId,
                quantity: quantity,
                defaultInventoryId: inventoryId,
                productLotId: null
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

        public async Task<List<ProductItem>> AddStockBulkAsync(BulkAddStockDTO bulkDto)
        {
            var allNewItems = new List<ProductItem>();
            var affectedProductIds = new HashSet<int>();
            
            // Fetch Lot info if provided
            ProductLot? lot = null;
            if (bulkDto.LotId.HasValue)
            {
                lot = await _context.ProductLots.FindAsync(bulkDto.LotId.Value);
            }

            foreach (var itemDto in bulkDto.Items)
            {
                var variant = await _context.ProductVariants
                    .Include(v => v.Product)
                        .ThenInclude(p => p!.Category)
                    .FirstOrDefaultAsync(v => v.Id == itemDto.VariantId);
                    
                if (variant == null) continue;

                affectedProductIds.Add(variant.ProductId);

                // Ensure product has a code
                if (string.IsNullOrEmpty(variant.Product?.Code))
                {
                    var product = variant.Product;
                    if (product != null)
                    {
                        var category = product.Category ?? await _context.Categories.FindAsync(product.CategoryId);
                        if (category != null)
                        {
                            if (string.IsNullOrEmpty(category.Code))
                            {
                                category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
                            }
                            product.Code = _codeGenerator.GenerateProductCode(category.Code, product.Id);
                        }
                    }
                }

                // Determine lot code
                string lotCode = "0000"; // Default for no lot
                if (lot != null && !string.IsNullOrEmpty(lot.Code))
                {
                    lotCode = lot.Code;
                }
                else if (lot != null)
                {
                    // Generate lot code if lot exists but doesn't have code
                    lot.Code = _codeGenerator.GenerateLotCode(lot.Id);
                    lotCode = lot.Code;
                }

                // Get current max sequence number for this variant to avoid duplicates
                var maxSeq = await _context.ProductItems
                    .Where(pi => pi.ProductVariantId == itemDto.VariantId)
                    .Select(pi => pi.Code)
                    .ToListAsync();
                
                int startingSequence = 0;
                if (maxSeq.Any())
                {
                    // Parse existing codes to find max sequence
                    foreach (var code in maxSeq)
                    {
                        try
                        {
                            var parsed = _codeGenerator.ParseProductItemCode(code);
                            if (parsed.SequentialNumber >= startingSequence)
                            {
                                startingSequence = parsed.SequentialNumber + 1;
                            }
                        }
                        catch
                        {
                            // Skip invalid codes
                        }
                    }
                }

                // Use factory to build items with hierarchical codes
                var items = _factory.BuildItems(
                    productCode: variant.Product!.Code!,
                    lotCode: lotCode,
                    variantId: itemDto.VariantId,
                    quantity: itemDto.Quantity,
                    defaultInventoryId: itemDto.InventoryId,
                    productLotId: bulkDto.LotId,
                    startingSequence: startingSequence
                );
                
                allNewItems.AddRange(items);
            }

            if (allNewItems.Any())
            {
                await _context.ProductItems.AddRangeAsync(allNewItems);
                await _context.SaveChangesAsync();
            }

            // Recalculate TotalQuantity for affected products efficiently
            if (affectedProductIds.Any())
            {
                var products = await _context.Products
                    .Include(p => p.Variants!)
                        .ThenInclude(v => v.ProductItems)
                    .Where(p => affectedProductIds.Contains(p.Id))
                    .ToListAsync();

                foreach (var product in products)
                {
                    product.TotalQuantity = product.Variants!
                        .Sum(v => v.ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0);
                }
                await _context.SaveChangesAsync();
            }

            return allNewItems;
        }

    }
}