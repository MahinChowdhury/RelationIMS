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
        public ProductRepository(ApplicationDbContext context,IMapper mapper)
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
            if (product == null) {
                return null;
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return product;
        }

        public async Task<List<Product>> GetAllProductsAsync(string? search, string? sortBy, string? stockOrder, int categoryId, int pageNumber, int pageSize)
        {
            var query = _context.Products.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(p => p.Name.Contains(search) || p.BrandName.Contains(search));
            }

            if (!string.IsNullOrEmpty(sortBy)) {
                if (sortBy.Equals("SKU")) query = query.OrderBy(p => p.Id);
                if (sortBy.Equals("Brand")) query = query.OrderBy(p => p.BrandName);
                if (sortBy.Equals("Priceasc")) query = query.OrderBy(p => p.BasePrice);
                if (sortBy.Equals("Pricedesc")) query = query.OrderByDescending(p => p.BasePrice);
            }

            if (categoryId != -1) {
                query = query.Where(p => p.CategoryId == categoryId);
            }

            if (!string.IsNullOrEmpty(stockOrder)){
                if (stockOrder.Equals("asc")) query = query.OrderBy(p => p.TotalQuantity);
                if (stockOrder.Equals("desc")) query = query.OrderByDescending(p => p.TotalQuantity);
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
                .Include(p => p.Variants!)
                .ThenInclude(v => v.Color)
                .Include(p => p.Variants!)
                .ThenInclude(v => v.Size)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) {
                return null;
            }

            return product;
        }

        public async Task<Product?> UpdateProductByIdAsync(int id, UpdateProductDTO updateDto) {

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) {
                return null;
            }

            product.Name = updateDto.Name;
            product.Description = updateDto.Description;
            product.BasePrice = updateDto.BasePrice;
            product.BrandName = updateDto.BrandName;
            product.CategoryId = updateDto.CategoryId;
            product.Variants = updateDto.Variants;

            int totalQuantity = updateDto.Variants!.Select(p => p.Quantity).Sum();
            product.TotalQuantity = totalQuantity;

            await _context.SaveChangesAsync();

            return product;
        }
    }
}
