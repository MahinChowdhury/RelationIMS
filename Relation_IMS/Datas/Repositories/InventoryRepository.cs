using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;
using Relation_IMS.Models.ProductModels;

namespace Relation_IMS.Datas.Repositories
{
    public class InventoryRepository : IInventoryRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IMapper _mapper;

        public InventoryRepository(ApplicationDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        // Create new inventory
        public async Task<Inventory> CreateNewInventoryAsync(CreateInventoryDTO inventoryDto)
        {
            var inventory = _mapper.Map<Inventory>(inventoryDto);
            await _context.Inventories.AddAsync(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        // Delete inventory by id
        public async Task<Inventory?> DeleteInventoryByIdAsync(int id)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null) return null;

            _context.Inventories.Remove(inventory);
            await _context.SaveChangesAsync();
            return inventory;
        }

        // Get all inventories
        public async Task<List<Inventory>> GetAllInventoriesAsync()
        {
            var inventories = await _context.Inventories.ToListAsync();
            return inventories;
        }

        // Get inventory by id
        public async Task<Inventory?> GetInventoryByIdAsync(int id)
        {
            var inventory = await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == id);

            return inventory;
        }

        // Update inventory by id
        public async Task<Inventory?> UpdateInventoryByIdAsync(int id, CreateInventoryDTO inventoryDto)
        {
            var inventory = await _context.Inventories.FindAsync(id);
            if (inventory == null) return null;

            inventory.Name = inventoryDto.Name;
            inventory.Description = inventoryDto.Description;
            await _context.SaveChangesAsync();
            return inventory;
        }

        // Transfer product item by code with source and destination validation
        public async Task<TransferResultDTO> TransferProductItemByCodeAsync(string productItemCode, int sourceInventoryId, int destinationInventoryId)
        {
            var result = new TransferResultDTO();

            // Verify source inventory exists and get its details
            var sourceInventory = await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == sourceInventoryId);

            if (sourceInventory == null)
            {
                result.Success = false;
                result.Message = "Source inventory not found.";
                return result;
            }

            // Verify destination inventory exists and get its details
            var destinationInventory = await _context.Inventories
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.Id == destinationInventoryId);

            if (destinationInventory == null)
            {
                result.Success = false;
                result.Message = "Destination inventory not found.";
                return result;
            }

            // Check if source and destination are the same
            if (sourceInventoryId == destinationInventoryId)
            {
                result.Success = false;
                result.Message = "Source and destination inventories cannot be the same.";
                return result;
            }

            // Get the item by code
            var item = await _context.ProductItems
                .FirstOrDefaultAsync(pi => pi.Code == productItemCode);

            if (item == null)
            {
                result.Success = false;
                result.Message = $"Product item with code '{productItemCode}' not found.";
                return result;
            }

            // Verify item is currently in the source inventory
            if (item.InventoryId != sourceInventoryId)
            {
                result.Success = false;
                result.Message = $"Product item '{productItemCode}' is not in the source inventory. Current inventory ID: {item.InventoryId}";
                return result;
            }

            // Check if item can be transferred (not defected or sold)
            if (item.IsDefected)
            {
                result.Success = false;
                result.Message = $"Cannot transfer defected item: {item.Code}";
                return result;
            }

            if (item.IsSold)
            {
                result.Success = false;
                result.Message = $"Cannot transfer sold item: {item.Code}";
                return result;
            }

            // Transfer item
            item.InventoryId = destinationInventoryId;
            await _context.SaveChangesAsync();

            // Build success response with full inventory details
            result.Success = true;
            result.Message = $"Successfully transferred item {item.Code} from '{sourceInventory.Name}' to '{destinationInventory.Name}'.";
            result.TransferredCount = 1;
            result.TransferDetails = new List<TransferItemDetail>
            {
                new TransferItemDetail
                {
                    Code = item.Code,
                    SourceInventoryId = sourceInventoryId,
                    SourceInventory = new InventoryBasicDTO
                    {
                        Id = sourceInventory.Id,
                        Name = sourceInventory.Name,
                        Description = sourceInventory.Description
                    },
                    DestinationInventoryId = destinationInventoryId,
                    DestinationInventory = new InventoryBasicDTO
                    {
                        Id = destinationInventory.Id,
                        Name = destinationInventory.Name,
                        Description = destinationInventory.Description
                    }
                }
            };

            return result;
        }

        // Get inventory stock summary by product variant - OPTIMIZED
        public async Task<List<InventoryStockDTO>> GetInventoryStockSummaryAsync(int inventoryId)
        {
            var stockSummary = await _context.ProductItems
                .AsNoTracking()
                .Where(pi => pi.InventoryId == inventoryId && !pi.IsDefected && !pi.IsSold)
                .GroupBy(pi => pi.ProductVariantId)
                .Select(g => new InventoryStockDTO
                {
                    ProductVariantId = g.Key,
                    Quantity = g.Count()
                })
                .ToListAsync();

            // Get additional details in a separate query if needed
            if (stockSummary.Any())
            {
                var variantIds = stockSummary.Select(s => s.ProductVariantId).ToList();
                var variantDetails = await _context.ProductVariants
                    .AsNoTracking()
                    .Where(v => variantIds.Contains(v.Id))
                    .Select(v => new
                    {
                        v.Id,
                        v.ProductId,
                        ProductName = v.Product!.Name,
                        ColorName = v.Color!.Name,
                        SizeName = v.Size!.Name
                    })
                    .ToListAsync();

                foreach (var stock in stockSummary)
                {
                    var detail = variantDetails.FirstOrDefault(d => d.Id == stock.ProductVariantId);
                    if (detail != null)
                    {
                        stock.ProductId = detail.ProductId;
                        stock.ProductName = detail.ProductName;
                        stock.ColorName = detail.ColorName;
                        stock.SizeName = detail.SizeName;
                    }
                }
            }

            return stockSummary;
        }

        // Get stock summary for a specific product across all inventories
        public async Task<List<ProductInventoryStockDTO>> GetProductStockAcrossInventoriesAsync(int productId)
        {
            var stockSummary = await _context.ProductItems
                .AsNoTracking()
                .Where(pi => pi.ProductVariant!.ProductId == productId && !pi.IsDefected && !pi.IsSold)
                .GroupBy(pi => new { pi.InventoryId, pi.ProductVariantId })
                .Select(g => new ProductInventoryStockDTO
                {
                    InventoryId = g.Key.InventoryId,
                    ProductVariantId = g.Key.ProductVariantId,
                    Quantity = g.Count()
                })
                .ToListAsync();

            // Get inventory and variant names
            if (stockSummary.Any())
            {
                var inventoryIds = stockSummary.Select(s => s.InventoryId).Distinct().ToList();
                var variantIds = stockSummary.Select(s => s.ProductVariantId).Distinct().ToList();

                var inventoryNames = await _context.Inventories
                    .AsNoTracking()
                    .Where(i => inventoryIds.Contains(i.Id))
                    .ToDictionaryAsync(i => i.Id, i => i.Name);

                var variantDetails = await _context.ProductVariants
                    .AsNoTracking()
                    .Where(v => variantIds.Contains(v.Id))
                    .Select(v => new
                    {
                        v.Id,
                        ColorName = v.Color!.Name,
                        SizeName = v.Size!.Name
                    })
                    .ToDictionaryAsync(v => v.Id);

                foreach (var stock in stockSummary)
                {
                    if (inventoryNames.TryGetValue(stock.InventoryId, out var invName))
                        stock.InventoryName = invName;

                    if (variantDetails.TryGetValue(stock.ProductVariantId, out var detail))
                    {
                        stock.ColorName = detail.ColorName;
                        stock.SizeName = detail.SizeName;
                    }
                }
            }

            return stockSummary;
        }

        // Get product items in an inventory with minimal details
        public async Task<List<ProductItemSummaryDTO>> GetInventoryProductItemsAsync(int inventoryId)
        {
            var items = await _context.ProductItems
                .AsNoTracking()
                .Where(pi => pi.InventoryId == inventoryId)
                .Select(pi => new ProductItemSummaryDTO
                {
                    Id = pi.Id,
                    Code = pi.Code,
                    ProductVariantId = pi.ProductVariantId,
                    ProductName = pi.ProductVariant!.Product!.Name,
                    ColorName = pi.ProductVariant.Color!.Name,
                    SizeName = pi.ProductVariant.Size!.Name,
                    IsDefected = pi.IsDefected,
                    IsSold = pi.IsSold
                })
                .ToListAsync();

            return items;
        }

        // Get variant stock across all inventories
        public async Task<List<VariantStockDTO>> GetVariantStockAcrossInventoriesAsync(int variantId)
        {
            var result = await _context.Inventories
                .Select(inv => new VariantStockDTO
                {
                    InventoryId = inv.Id,
                    Inventory = inv,
                    Quantity = inv.ProductItems!
                        .Where(pi => pi.ProductVariantId == variantId && !pi.IsDefected && !pi.IsSold)
                        .Count()
                })
                .ToListAsync();

            return result;
        }
    }

    // ===== DTOs =====

    // Simplified DTO for inventory stock summary
    public class InventoryStockDTO
    {
        public int ProductVariantId { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    // DTO for product stock across inventories
    public class ProductInventoryStockDTO
    {
        public int InventoryId { get; set; }
        public string InventoryName { get; set; } = string.Empty;
        public int ProductVariantId { get; set; }
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public int Quantity { get; set; }
    }

    // DTO for product item summary
    public class ProductItemSummaryDTO
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public int ProductVariantId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string ColorName { get; set; } = string.Empty;
        public string SizeName { get; set; } = string.Empty;
        public bool IsDefected { get; set; }
        public bool IsSold { get; set; }
    }

}