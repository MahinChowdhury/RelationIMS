using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;
using Relation_IMS.Models.InventoryModels;
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

        // Transfer product items by codes with source and destination validation
        public async Task<TransferResultDTO> TransferProductItemsByCodesAsync(List<string> productItemCodes, int sourceInventoryId, int destinationInventoryId, int userId)
        {
            var result = new TransferResultDTO
            {
                InvalidCodes = new List<string>(),
                TransferDetails = new List<TransferItemDetail>()
            };

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

            // Get all items by codes
            var items = await _context.ProductItems
                .Where(pi => productItemCodes.Contains(pi.Code))
                .ToListAsync();

            // Validate all items
            var validItems = new List<ProductItem>();
            var errorMessages = new List<string>();

            // Check for missing items
            foreach (var code in productItemCodes)
            {
                var item = items.FirstOrDefault(i => i.Code == code);
                if (item == null)
                {
                    result.InvalidCodes.Add(code);
                    errorMessages.Add($"Item '{code}' not found.");
                    continue;
                }

                // Verify item is currently in the source inventory
                if (item.InventoryId != sourceInventoryId)
                {
                    result.InvalidCodes.Add(code);
                    errorMessages.Add($"Item '{code}' is not in the source inventory.");
                    continue;
                }

                // Check if item can be transferred (not defected or sold)
                if (item.IsDefected)
                {
                    result.InvalidCodes.Add(code);
                    errorMessages.Add($"Item '{code}' is defected.");
                    continue;
                }

                if (item.IsSold)
                {
                    result.InvalidCodes.Add(code);
                    errorMessages.Add($"Item '{code}' is sold.");
                    continue;
                }

                validItems.Add(item);
            }

            // If there are any invalid codes, fail the transaction
            if (result.InvalidCodes.Any())
            {
                result.Success = false;
                result.Message = $"Transfer failed. {result.InvalidCodes.Count} invalid items found: {string.Join(", ", errorMessages)}";
                return result;
            }

            // Begin execution strategy for transaction (optional but good practice, assuming default execution strategy implicitly)
            // Or better, use a transaction block if needed. EF Core `SaveChanges` is atomic, so if we just modify entities and save, it's a transaction.
            // But we are creating a new record too, so single SaveChanges is fine.

            // Transfer items
            foreach (var item in validItems)
            {
                item.InventoryId = destinationInventoryId;
                
                // Add to transfer details result
                result.TransferDetails.Add(new TransferItemDetail
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
                });
            }

            // Create Inventory Transfer Record
            var transferRecord = new InventoryTransferRecord
            {
                SourceInventoryId = sourceInventoryId,
                DestinationInventoryId = destinationInventoryId,
                UserId = userId,
                DateTime = DateTime.UtcNow,
                ProductItems = validItems // Link the transferred items to this record
            };

            await _context.InventoryTransferRecords.AddAsync(transferRecord);
            await _context.SaveChangesAsync();

            // Build success response
            result.Success = true;
            result.Message = $"Successfully transferred {validItems.Count} items from '{sourceInventory.Name}' to '{destinationInventory.Name}'.";
            result.TransferredCount = validItems.Count;

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

        // Get inventory transfer records with filtering and pagination
        public async Task<List<InventoryTransferHistoryDTO>> GetInventoryTransferRecordsAsync(int pageNumber = 1, int pageSize = 20, string? search = null, DateTime? date = null, int? sourceId = null, int? destinationId = null, int? userId = null)
        {
            var query = _context.InventoryTransferRecords
                .Include(r => r.SourceInventory)
                .Include(r => r.DestinationInventory)
                .Include(r => r.User)
                .Include(r => r.ProductItems)
                    .ThenInclude(pi => pi.ProductVariant)
                        .ThenInclude(pv => pv.Product)
                .Include(r => r.ProductItems)
                    .ThenInclude(pi => pi.ProductVariant)
                        .ThenInclude(pv => pv.Color)
                .Include(r => r.ProductItems)
                    .ThenInclude(pi => pi.ProductVariant)
                        .ThenInclude(pv => pv.Size)
                .AsNoTracking();

            // Apply filters based on search term
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(r => 
                    r.ProductItems.Any(pi => 
                        pi.ProductVariant!.Product!.Name.ToLower().Contains(search) || 
                        pi.Code.ToLower().Contains(search)));
            }

            if (date.HasValue)
            {
                // Filter by date (ignoring time)
                var nextDay = date.Value.AddDays(1);
                query = query.Where(r => r.DateTime >= date.Value && r.DateTime < nextDay);
            }

            if (sourceId.HasValue)
            {
                query = query.Where(r => r.SourceInventoryId == sourceId);
            }

            if (destinationId.HasValue)
            {
                query = query.Where(r => r.DestinationInventoryId == destinationId);
            }

            if (userId.HasValue)
            {
                query = query.Where(r => r.UserId == userId);
            }

            // Execute query with pagination
            var records = await query
                .OrderByDescending(r => r.DateTime)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            // Map to DTO
            var result = records.Select(r => new InventoryTransferHistoryDTO
            {
                Id = r.Id,
                Date = r.DateTime,
                SourceInventoryName = r.SourceInventory?.Name ?? "Unknown",
                DestinationInventoryName = r.DestinationInventory?.Name ?? "Unknown",
                UserName = r.User != null ? $"{r.User.Firstname} {r.User.Lastname}".Trim() : "Unknown",
                UserAvatarUrl = null,
                Items = r.ProductItems
                    .GroupBy(pi => pi.ProductVariantId)
                    .Select(g => {
                        var firstItem = g.First();
                        return new TransferHistoryItemDTO
                        {
                            ProductId = firstItem.ProductVariant!.ProductId,
                            ProductName = firstItem.ProductVariant.Product!.Name,
                            ProductSku = firstItem.Code, // Using Item Code as SKU since Product/Variant SKU is missing
                            ProductImageUrl = firstItem.ProductVariant.Product?.ImageUrls?.FirstOrDefault(), // Use first image from product
                            ProductVariantId = g.Key,
                            ColorName = firstItem.ProductVariant.Color?.Name ?? "N/A",
                            SizeName = firstItem.ProductVariant.Size?.Name ?? "N/A",
                            Quantity = g.Count()
                        };
                    }).ToList()
            }).ToList();

            return result;
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



}