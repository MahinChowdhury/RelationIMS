using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;
using System;

namespace Relation_IMS.Datas.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        private readonly ProductCodeGenerator _codeGenerator;
        public ProductRepository(ApplicationDbContext context, IMapper mapper, ProductCodeGenerator codeGenerator)
        {
            _context = context;
            _mapper = mapper;
            _codeGenerator = codeGenerator;
        }

        public async Task<Product?> CreateProductAsync(CreateNewProductDTO productDto)
        {
            var product = _mapper.Map<Product>(productDto);
            Console.WriteLine($"Mapped Product: {product.Name}, CategoryId: {product.CategoryId}");
            
            product.Quarters = await _context.Quarters
                .Where(q => productDto.QuarterIds.Contains(q.Id))
                .ToListAsync();
            
            // Get category to generate code
            var category = await _context.Categories.FindAsync(product.CategoryId);
            if (category == null)
                throw new InvalidOperationException($"Category with ID {product.CategoryId} not found");
            
            // Ensure category has a code
            if (string.IsNullOrEmpty(category.Code))
            {
                category.Code = _codeGenerator.GenerateCategoryCode(category.Name);
            }
            
            var created = await _context.Products.AddAsync(product);
            await _context.SaveChangesAsync();
            
            // Generate product code: {CategoryFirstLetter}{ProductId:D4}
            product.Code = _codeGenerator.GenerateProductCode(category.Code, product.Id);
            await _context.SaveChangesAsync();
            
            return product;
        }

        public async Task<Product?> DeleteProductByIdAsync(int id)
        {
            var product = _context.Products.FirstOrDefault(p => p.Id == id);
            if (product == null)
            {
                return null;
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return product;
        }

        public async Task<List<Product>> GetAllProductsAsync(string? search, string? sortBy, string? stockOrder, int brandId, int categoryId, int quarterId, int pageNumber, int pageSize)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                         (p.Brand.Name.ToLower().Contains(searchLower)) ||
                                         (p.Category.Name.ToLower().Contains(searchLower)) ||
                                         (p.Quarters.Any(q => q.Name.ToLower().Contains(searchLower))));
            }

            if (!string.IsNullOrEmpty(sortBy))
            {
                if (sortBy.Equals("SKU")) query = query.OrderBy(p => p.Id);
                if (sortBy.Equals("Brand")) query = query.OrderBy(p => p.BrandId);
                if (sortBy.Equals("Price Ascending")) query = query.OrderBy(p => p.BasePrice);
                if (sortBy.Equals("Price Descending")) query = query.OrderByDescending(p => p.BasePrice);
            }
            else
            {
                query = query.OrderBy(p => p.Id);
            }

            if (brandId != -1)
            {
                query = query.Where(p => p.BrandId == brandId);
            }

            if (categoryId != -1)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            if (quarterId != -1)
            {
                query = query.Where(p => p.Quarters.Any(q => q.Id == quarterId));
            }

            if (!string.IsNullOrEmpty(stockOrder))
            {
                if (stockOrder.Equals("Ascending")) query = query.OrderBy(p => p.TotalQuantity);
                if (stockOrder.Equals("Descending")) query = query.OrderByDescending(p => p.TotalQuantity);

                // Filter Logic
                if (stockOrder.Equals("in-stock")) query = query.Where(p => p.TotalQuantity > 0);
                if (stockOrder.Equals("out-of-stock")) query = query.Where(p => p.TotalQuantity == 0);
                if (stockOrder.Equals("low-stock")) query = query.Where(p => p.TotalQuantity > 0 && p.TotalQuantity < 10);
            }

            var products = await query
                .Include(p => p.Quarters)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return products;
        }

        public async Task<Product?> GetProductByIdAsync(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Quarters)
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.Color)
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.Size)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return null;
            }

            // Manually compute Quantity and Defects using a fast aggregate query
            var variantStats = await _context.ProductItems
                .Where(pi => pi.ProductVariant!.ProductId == id)
                .GroupBy(pi => pi.ProductVariantId)
                .Select(g => new
                {
                    VariantId = g.Key,
                    Quantity = g.Count(pi => !pi.IsDefected && !pi.IsSold && pi.OrderItemId == null),
                    Defects = g.Count(pi => pi.IsDefected)
                })
                .ToListAsync();

            if (product.Variants != null)
            {
                foreach (var variant in product.Variants)
                {
                    var stat = variantStats.FirstOrDefault(s => s.VariantId == variant.Id);
                    variant.Quantity = stat?.Quantity ?? 0;
                    variant.Defects = stat?.Defects ?? 0;
                }
            }

            return product;
        }

        public async Task<Product?> UpdateProductByIdAsync(int id, UpdateProductDTO updateDto)
        {
            var product = await _context.Products
                .Include(p => p.Quarters)
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return null;

            // Update scalar fields
            product.Name = updateDto.Name;
            product.Description = updateDto.Description;
            product.BasePrice = updateDto.BasePrice;
            if (updateDto.CostBD > 0)
            {
                product.CostBD = updateDto.CostBD;
            }
            if (updateDto.CostRMB > 0)
            {
                product.CostRMB = updateDto.CostRMB;
            }
            product.MSRP = updateDto.MSRP;
            product.BrandId = updateDto.BrandId;
            product.CategoryId = updateDto.CategoryId;
            
            // Handle Quarters explicitly for Many-to-Many tracking
            product.Quarters?.Clear();
            var newQuarters = await _context.Quarters
                .Where(q => updateDto.QuarterIds.Contains(q.Id))
                .ToListAsync();
            foreach(var q in newQuarters)
            {
                product.Quarters?.Add(q);
            }

            // Handle ImageUrls (replace all)
            product.ImageUrls = updateDto.ImageUrls ?? new List<string>();

            // Handle ThumbnailUrl
            product.ThumbnailUrl = updateDto.ThumbnailUrl;

            // ── ONLY if you want to sync variants via DTO ─────────────────────
            if (updateDto.Variants != null)
            {
                // Remove old variants not in the new list
                var newIds = updateDto.Variants.Where(v => v.Id > 0).Select(v => v.Id).ToList();
                var toRemove = product.Variants!.Where(v => !newIds.Contains(v.Id)).ToList();
                _context.ProductVariants.RemoveRange(toRemove);

                // Add / Update
                foreach (var dtoVar in updateDto.Variants)
                {
                    var existing = product.Variants!.FirstOrDefault(v => v.Id == dtoVar.Id);
                    if (existing != null)
                    {
                        existing.ProductColorId = dtoVar.ProductColorId;
                        existing.ProductSizeId = dtoVar.ProductSizeId;
                    }
                    else
                    {
                        product.Variants!.Add(new ProductVariant
                        {
                            ProductId = product.Id,
                            ProductColorId = dtoVar.ProductColorId,
                            ProductSizeId = dtoVar.ProductSizeId,
                        });
                    }
                }
            }

            // Recalculate total quantity based on ProductItems
            await _context.Entry(product).Collection(p => p.Variants!).LoadAsync();
            foreach (var variant in product.Variants!)
            {
                await _context.Entry(variant).Collection(v => v.ProductItems!).LoadAsync();
            }

            product.TotalQuantity = product.Variants!
                .Sum(v => v.ProductItems?.Count(pi => !pi.IsDefected && !pi.IsSold) ?? 0);

            await _context.SaveChangesAsync();
            return product;
        }

        public async Task<List<Product>> GetProductsByOwnerIdAsync(int ownerId, string? search, string? sortBy, string? stockOrder, int brandId, int categoryId, int quarterId, int pageNumber, int pageSize)
        {
            var query = _context.Products
                .Where(p => p.CreatedBy == ownerId)
                .AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(p => p.Name.ToLower().Contains(searchLower) || 
                                         (p.Brand.Name.ToLower().Contains(searchLower)) ||
                                         (p.Category.Name.ToLower().Contains(searchLower)) ||
                                         (p.Quarters.Any(q => q.Name.ToLower().Contains(searchLower))));
            }

            if (!string.IsNullOrEmpty(sortBy))
            {
                if (sortBy.Equals("SKU")) query = query.OrderBy(p => p.Id);
                if (sortBy.Equals("Brand")) query = query.OrderBy(p => p.BrandId);
                if (sortBy.Equals("Price Ascending")) query = query.OrderBy(p => p.BasePrice);
                if (sortBy.Equals("Price Descending")) query = query.OrderByDescending(p => p.BasePrice);
            }
            else
            {
                query = query.OrderBy(p => p.Id);
            }

            if (brandId != -1)
            {
                query = query.Where(p => p.BrandId == brandId);
            }

            if (categoryId != -1)
            {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            if (quarterId != -1)
            {
                query = query.Where(p => p.Quarters.Any(q => q.Id == quarterId));
            }

            if (!string.IsNullOrEmpty(stockOrder))
            {
                if (stockOrder.Equals("Ascending")) query = query.OrderBy(p => p.TotalQuantity);
                if (stockOrder.Equals("Descending")) query = query.OrderByDescending(p => p.TotalQuantity);

                if (stockOrder.Equals("in-stock")) query = query.Where(p => p.TotalQuantity > 0);
                if (stockOrder.Equals("out-of-stock")) query = query.Where(p => p.TotalQuantity == 0);
                if (stockOrder.Equals("low-stock")) query = query.Where(p => p.TotalQuantity > 0 && p.TotalQuantity < 10);
            }

            var products = await query
                .Include(p => p.Category)
                .Include(p => p.Brand)
                .Include(p => p.Quarters)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return products;
        }

        public async Task<object> GetItemsForBarcodeAsync(int productId)
        {
            var barcodes = await _context.ProductItems
                .Include(pi => pi.ProductVariant)
                    .ThenInclude(pv => pv!.Color)
                .Include(pi => pi.ProductVariant)
                    .ThenInclude(pv => pv!.Size)
                .Where(pi => pi.ProductVariant!.ProductId == productId && !pi.IsSold && !pi.IsDefected)
                .Select(pi => new 
                {
                    code = pi.Code,
                    itemDetails = $"Color: {pi.ProductVariant!.Color!.Name ?? pi.ProductVariant.ProductColorId.ToString()}, Size: {pi.ProductVariant.Size!.Name ?? pi.ProductVariant.ProductSizeId.ToString()}"
                })
                .ToListAsync();

            return barcodes;
        }
    }
}