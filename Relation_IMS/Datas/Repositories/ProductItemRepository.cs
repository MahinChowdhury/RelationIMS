using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.ProductDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories
{
    public class ProductItemRepository : IProductItemRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public ProductItemRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<ProductItem>> GetAllProductItemsAsync()
        {
            var items = await _context.ProductItems
                .ToListAsync();

            return items;
        }

        public async Task<List<ProductItem>> GetAllDefectedProductItemsAsync()
        {
            var items = await _context.ProductItems
                .Where(i => i.IsDefected == true)
                .ToListAsync();

            return items;
        }


        public async Task<ProductItem?> GetProductItemByIdAsync(int id)
        {
            var item = await _context.ProductItems
                .Include(x => x.ProductVariant)
                .Include(x => x.Inventory)
                .FirstOrDefaultAsync(x => x.Id == id);

            return item;
        }

        public async Task<ProductItem> CreateProductItemAsync(CreateProductItemDTO itemDto)
        {
            var item = _mapper.Map<ProductItem>(itemDto);
            await _context.ProductItems.AddAsync(item);
            await _context.SaveChangesAsync();

            return item;
        }

        public async Task<ProductItem?> UpdateProductItemAsync(int id, CreateProductItemDTO itemDto)
        {
            var item = await _context.ProductItems.FindAsync(id);
            if (item == null) return null;

            item.Code = itemDto.Code;
            item.ProductVariantId = itemDto.ProductVariantId;
            item.InventoryId = itemDto.InventoryId;
            item.IsDefected = itemDto.IsDefected;
            item.IsSold = itemDto.IsSold;

            await _context.SaveChangesAsync();
            return item;
        }
        public async Task<ProductItem?> DeleteProductItemAsync(int id)
        {
            var item = await _context.ProductItems.FindAsync(id);
            if (item == null) return null;

            _context.ProductItems.Remove(item);
            await _context.SaveChangesAsync();

            return item;
        }

        //public async Task<ProductItem?> DefectProductItemByIdAsync(int id)
        //{
        //    var item = await _context.ProductItems.Include(i => i.ProductVariant).FirstOrDefaultAsync(x => x.Id == id);
        //    if (item == null) return null;

        //    item.IsDefected = true;

        //    await _context.SaveChangesAsync();

        //    return item;
        //}
        public async Task<ProductItem?> DefectProductItemByCodeAsync(string code)
        {
            var item = await _context.ProductItems.Include(i => i.ProductVariant).FirstOrDefaultAsync(x => x.Code == code);
            if (item == null) return null;

            item.IsDefected = true;

            await _context.SaveChangesAsync();

            return item;
        }
    }
}