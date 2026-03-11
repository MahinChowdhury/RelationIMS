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

        public async Task<List<DefectItemResDTO>> GetAllDefectedProductItemsAsync()
        {
            var defects = await _context.ProductDefects
                .Include(d => d.ProductItem)
                    .ThenInclude(pi => pi!.ProductVariant)
                        .ThenInclude(pv => pv!.Product)
                .Include(d => d.ReportedByUser)
                .OrderByDescending(d => d.DefectDate)
                .Select(d => new DefectItemResDTO
                {
                    Id = d.Id,
                    ProductItemId = d.ProductItemId,
                    Code = d.ProductItem!.Code,
                    ProductName = d.ProductItem.ProductVariant!.Product!.Name,
                    Reason = d.Reason,
                    Status = d.Status,
                    ReportedBy = d.ReportedByUser != null ? d.ReportedByUser.Firstname + " " + (d.ReportedByUser.Lastname ?? "") : "Unknown",
                    DefectDate = d.DefectDate,
                    ProductImageUrl = d.ProductItem.ProductVariant.Product.ImageUrls != null ? d.ProductItem.ProductVariant.Product.ImageUrls.FirstOrDefault() : null 
                })
                .ToListAsync();

            return defects;
        }


        public async Task<ProductItem?> GetProductItemByIdAsync(int id)
        {
            var item = await _context.ProductItems
                .Include(x => x.ProductVariant)
                    .ThenInclude(v => v.Product)
                .Include(x => x.Inventory)
                .FirstOrDefaultAsync(x => x.Id == id);

            return item;
        }

        public async Task<ProductItemResponseDTO?> GetProductItemByCodeAsync(string code)
        {
            var item = await _context.ProductItems
                .Include(x => x.ProductVariant)
                    .ThenInclude(v => v.Product)
                .Include(x => x.ProductVariant)
                    .ThenInclude(v => v.Color)
                .Include(x => x.ProductVariant)
                    .ThenInclude(v => v.Size)
                .Include(x => x.Inventory)
                .FirstOrDefaultAsync(x => x.Code == code);

            if (item == null) return null;

            // Map to DTO to ensure all price fields are included
            return new ProductItemResponseDTO
            {
                Id = item.Id,
                Code = item.Code,
                ProductVariantId = item.ProductVariantId,
                IsDefected = item.IsDefected,
                IsSold = item.IsSold,
                VariantPrice = item.ProductVariant?.VariantPrice ?? 0,
                ColorName = item.ProductVariant?.Color?.Name,
                SizeName = item.ProductVariant?.Size?.Name,
                ProductId = item.ProductVariant?.Product?.Id ?? 0,
                ProductName = item.ProductVariant?.Product?.Name ?? "Unknown",
                BasePrice = item.ProductVariant?.Product?.BasePrice ?? 0,
                ImageUrls = item.ProductVariant?.Product?.ImageUrls,
                ThumbnailUrl = item.ProductVariant?.Product?.ThumbnailUrl,
                ThumbnailUrlLarge = item.ProductVariant?.Product?.ThumbnailUrlLarge
            };
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
        public async Task<DefectItemResDTO?> DefectProductItemByCodeAsync(string code, DefectRequestDTO defectDto, int? userId)
        {
            var item = await _context.ProductItems
                .Include(i => i.ProductVariant)
                .ThenInclude(pv => pv!.Product)
                .FirstOrDefaultAsync(x => x.Code == code);

            if (item == null) return null;

            // 1. Mark item as defected
            item.IsDefected = true;

            // 2. Create Defect Record
            var defectRecord = new ProductDefect
            {
                ProductItemId = item.Id,
                Reason = defectDto.Reason,
                Status = DefectStatus.Pending,
                ReportedByUserId = userId,
                DefectDate = DateTime.UtcNow
            };

            await _context.ProductDefects.AddAsync(defectRecord);
            await _context.SaveChangesAsync();

            // 3. Return DTO
            // We need to fetch the user name if userId is present, or just use current context (but repo shouldn't know about HttpContext).
            // For now, let's fetch it or just return basic info.
            string reportedByName = "Unknown";
            if (userId.HasValue)
            {
                var user = await _context.Users.FindAsync(userId.Value);
                if (user != null) reportedByName = user.Firstname + " " + (user.Lastname ?? "");
            }

            return new DefectItemResDTO
            {
                Id = defectRecord.Id,
                ProductItemId = item.Id,
                Code = item.Code,
                ProductName = item.ProductVariant?.Product?.Name ?? "Unknown",
                Reason = defectRecord.Reason,
                Status = defectRecord.Status,
                ReportedBy = reportedByName,
                DefectDate = defectRecord.DefectDate,
                ProductImageUrl = item.ProductVariant?.Product?.ImageUrls?.FirstOrDefault()
            };
        }
    }
}