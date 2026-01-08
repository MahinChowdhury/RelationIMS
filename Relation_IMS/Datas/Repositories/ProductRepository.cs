using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;
using System;

namespace Relation_IMS.Datas.Repositories
{
    public class ProductRepository : IProductRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;
        public ProductRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<Product?> CreateProductAsync(CreateNewProductDTO productDto)
        {
            var product = _mapper.Map<Product>(productDto);
            Console.WriteLine($"Mapped Product: {product.Name}, CategoryId: {product.CategoryId}");
            var created = await _context.Products.AddAsync(product);
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

        public async Task<List<Product>> GetAllProductsAsync(string? search, string? sortBy, string? stockOrder, int brandId, int categoryId, int pageNumber, int pageSize)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search, StringComparison.OrdinalIgnoreCase) || p.Brand!.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
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

            if (!string.IsNullOrEmpty(stockOrder))
            {
                if (stockOrder.Equals("Ascending")) query = query.OrderBy(p => p.TotalQuantity);
                if (stockOrder.Equals("Descending")) query = query.OrderByDescending(p => p.TotalQuantity);
            }

            var products = await query
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
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.Color)
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.Size)
                .Include(p => p.Variants!)
                    .ThenInclude(v => v.ProductItems!)
                        .ThenInclude(pi => pi.Inventory)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
            {
                return null;
            }

            return product;
        }

        public async Task<Product?> UpdateProductByIdAsync(int id, UpdateProductDTO updateDto)
        {
            var product = await _context.Products
                .Include(p => p.Variants)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null) return null;

            // Update scalar fields
            product.Name = updateDto.Name;
            product.Description = updateDto.Description;
            product.BasePrice = updateDto.BasePrice;
            product.BrandId = updateDto.BrandId;
            product.CategoryId = updateDto.CategoryId;

            // Handle ImageUrls (replace all)
            product.ImageUrls = updateDto.ImageUrls ?? new List<string>();

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
    }
}