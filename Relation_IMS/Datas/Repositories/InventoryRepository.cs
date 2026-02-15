using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos;
using Relation_IMS.Dtos.InventoryDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models;
using Relation_IMS.Models.InventoryModels;
using Relation_IMS.Models.OrderModels;
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

            // Start loop to validate and pick items
            foreach (var code in productItemCodes)
            {
                // Find first matching item that hasn't been picked yet
                // We search in 'items' list. Since we want to pick unique instances for each code occurrence,
                // we need to remove the picked item from 'items' list or track used IDs.
                
                var item = items.FirstOrDefault(i => i.Code == code);
                
                if (item == null)
                {
                    // If no item found in remaining list, it means either code is wrong 
                    // OR we ran out of stock for that code (requested 5, found 4)
                    result.InvalidCodes.Add(code);
                    errorMessages.Add($"Item '{code}' not found or insufficient quantity.");
                    continue;
                }

                // Remove from pool so it's not picked again
                items.Remove(item);

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
                DateTime = DateTime.UtcNow
            };

            // Link items using Join Entity (Many-to-Many logic)
            foreach (var item in validItems)
            {
                 // Create record item link
                 transferRecord.TransferItems.Add(new InventoryTransferRecordItem
                 {
                     ProductItem = item
                 });

                 // Update item's current location
                 item.InventoryId = destinationInventoryId;
            }

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
                    ProductId = pi.ProductVariant!.ProductId,
                    ProductVariantId = pi.ProductVariantId,
                    ProductName = pi.ProductVariant!.Product!.Name,
                    CategoryName = pi.ProductVariant.Product.Category != null ? pi.ProductVariant.Product.Category.Name : "Uncategorized",
                    Price = pi.ProductVariant.Product.BasePrice,
                    ColorName = pi.ProductVariant.Color!.Name,
                    SizeName = pi.ProductVariant.Size!.Name,
                    ProductImageUrl = pi.ProductVariant.Product.ImageUrls != null ? pi.ProductVariant.Product.ImageUrls.FirstOrDefault() : null,
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
                // Include navigation through Join Table
                .Include(r => r.TransferItems)
                    .ThenInclude(ti => ti.ProductItem!)
                        .ThenInclude(pi => pi.ProductVariant!)
                            .ThenInclude(pv => pv!.Product)
                .Include(r => r.TransferItems)
                    .ThenInclude(ti => ti.ProductItem!)
                        .ThenInclude(pi => pi.ProductVariant!)
                            .ThenInclude(pv => pv!.Color)
                .Include(r => r.TransferItems)
                    .ThenInclude(ti => ti.ProductItem!)
                        .ThenInclude(pi => pi.ProductVariant!)
                            .ThenInclude(pv => pv!.Size)
                .AsNoTracking();

            // Apply filters based on search term (Updated to check TransferItems)
            if (!string.IsNullOrWhiteSpace(search))
            {
                search = search.ToLower();
                query = query.Where(r => 
                    r.TransferItems.Any(ti => 
                        ti.ProductItem!.ProductVariant!.Product!.Name.ToLower().Contains(search) || 
                        ti.ProductItem.Code.ToLower().Contains(search)));
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
                Items = r.TransferItems
                    // Flatten to product items
                    .Select(ti => ti.ProductItem!) 
                    // Now simple select each physical item as its own row (frontend will group if needed, or we display all)
                    .Select(pi => new TransferHistoryItemDTO
                    {
                        ProductId = pi.ProductVariant!.ProductId,
                        ProductName = pi.ProductVariant.Product!.Name,
                        ProductSku = pi.Code, // Using Item Code/Serial
                        ProductImageUrl = pi.ProductVariant.Product?.ImageUrls?.FirstOrDefault(),
                        ProductVariantId = pi.ProductVariantId,
                        ColorName = pi.ProductVariant.Color?.Name ?? "N/A",
                        SizeName = pi.ProductVariant.Size?.Name ?? "N/A",
                        Quantity = 1 
                    }).ToList()
            }).ToList();

            return result;
        }

        // Get variant stock across all inventories
        public async Task<List<VariantStockDTO>> GetVariantStockAcrossInventoriesAsync(int variantId)
        {
            var items = await _context.ProductItems
                .AsNoTracking()
                .Where(pi => pi.ProductVariantId == variantId && !pi.IsSold)
                .Select(pi => new 
                { 
                    pi.InventoryId, 
                    pi.Code, 
                    pi.IsDefected 
                })
                .ToListAsync();

            var inventoryIds = items.Select(i => i.InventoryId).Distinct().ToList();
            
            var inventories = await _context.Inventories
                .AsNoTracking()
                .Where(i => inventoryIds.Contains(i.Id))
                .ToListAsync();

            var result = inventories.Select(inv => 
            {
                var invItems = items.Where(i => i.InventoryId == inv.Id).ToList();
                return new VariantStockDTO
                {
                    InventoryId = inv.Id,
                    Inventory = inv,
                    Quantity = invItems.Count(i => !i.IsDefected),
                    DefectQuantity = invItems.Count(i => i.IsDefected),
                    AvailableItemCodes = invItems.Where(i => !i.IsDefected).Select(i => i.Code).ToList(),
                    DefectItemCodes = invItems.Where(i => i.IsDefected).Select(i => i.Code).ToList()
                };
            }).ToList();

            return result;
        }


        // Process Customer Return (Batch)
        public async Task<TransferResultDTO> ProcessCustomerReturnAsync(CustomerReturnRequestDTO returnDto)
        {
            // 0. Sanitize Input
            if (returnDto.ProductCodes == null || !returnDto.ProductCodes.Any())
            {
                 return new TransferResultDTO { Success = false, Message = "No items to return." };
            }
            // Remove empty strings
            returnDto.ProductCodes = returnDto.ProductCodes.Where(c => !string.IsNullOrWhiteSpace(c)).ToList();

            var result = new TransferResultDTO
            {
                Success = false,
                InvalidCodes = new List<string>(),
                TransferDetails = new List<TransferItemDetail>() // We reuse this DTO for response details
            };

            // 1. Validate Customer
            var customer = await _context.Customers.FindAsync(returnDto.CustomerId);
            if (customer == null)
            {
                result.Message = "Customer not found.";
                return result;
            }

            // 2. Validate Target Inventory
            var inventory = await _context.Inventories.FindAsync(returnDto.TargetInventoryId);
            if (inventory == null)
            {
                result.Message = "Target inventory not found.";
                return result;
            }

            // 2b. Validate Order (if provided)
            Order? linkedOrder = null;
            List<OrderItem>? orderItems = null;

            if (returnDto.OrderId.HasValue)
            {
                linkedOrder = await _context.Orders
                    .Include(o => o.OrderItems)
                    .FirstOrDefaultAsync(o => o.Id == returnDto.OrderId.Value);

                if (linkedOrder == null)
                {
                    result.Message = $"Order #{returnDto.OrderId} not found.";
                    return result;
                }

                if (linkedOrder.CustomerId != returnDto.CustomerId)
                {
                    result.Message = $"Order #{returnDto.OrderId} does not belong to this customer.";
                    return result;
                }

                orderItems = linkedOrder.OrderItems;
            }

            // 3. Find and Validate All Products
            // Fetch potential items first
            var products = await _context.ProductItems
                .Where(pi => returnDto.ProductCodes.Contains(pi.Code))
                .ToListAsync();

            var validItems = new List<ProductItem>();
            var errors = new List<string>();

            foreach (var code in returnDto.ProductCodes)
            {
                // Logic to pick correct item instance essentially same as transfer logic, 
                // but checking IsSold = true
                
                // Find sold item with this code
                var item = products.FirstOrDefault(p => p.Code == code && p.IsSold);
                
                // If not found in loaded products, check if it's there but unsold?
                if (item == null)
                {
                    // Maybe it exists but is NOT sold?
                    var unsold = products.FirstOrDefault(p => p.Code == code && !p.IsSold);
                    if (unsold != null)
                    {
                        result.InvalidCodes.Add(code);
                        errors.Add($"Item '{code}' is not marked as sold.");
                    }
                    else
                    {
                        // Not found at all
                        result.InvalidCodes.Add(code);
                        errors.Add($"Item '{code}' not found.");
                    }
                    continue;
                }

                // VALIDATE AGAINST ORDER (if OrderId provided)
                if (orderItems != null)
                {
                    // Check if this item's Variant exists in the Order's Items
                    var inOrder = orderItems.Any(oi => oi.ProductVariantId == item.ProductVariantId);
                    
                    // If strict generic product match only (fallback)
                    if (!inOrder)
                    {
                         inOrder = orderItems.Any(oi => oi.ProductId == item.ProductVariant?.ProductId);
                    }

                    if (!inOrder)
                    {
                        result.InvalidCodes.Add(code);
                        errors.Add($"Item '{code}' (Variant {item.ProductVariantId}) is not part of Order #{returnDto.OrderId}.");
                        continue;
                    }
                }

                // Found valid item. Remove from pool if duplicate codes existed (unlikely for unique items but safe)
                products.Remove(item);
                validItems.Add(item);
            }

            if (result.InvalidCodes.Any())
            {
                result.Message = $"Return failed. Invalid items: {string.Join(", ", errors)}";
                return result;
            }

            // 4. Create Return Record
            var returnRecord = new CustomerReturnRecord
            {
                CustomerId = returnDto.CustomerId,
                RefundAmount = returnDto.RefundAmount,
                ReturnDate = DateTime.UtcNow,
                UserId = returnDto.UserId,
                OrderId = returnDto.OrderId
            };

            // 5. Process Each Item
            foreach (var item in validItems)
            {
                // Update item status
                item.IsSold = false;
                item.InventoryId = returnDto.TargetInventoryId;
                
                // Add to return record
                returnRecord.ReturnItems.Add(new CustomerReturnItem
                {
                    ProductItem = item
                });
            }

            // 6. Update Customer Balance
            customer.Balance += returnDto.RefundAmount;
            
            // 7. Save changes
            await _context.CustomerReturnRecords.AddAsync(returnRecord);
            await _context.SaveChangesAsync();

            result.Success = true;
            result.Message = $"Successfully returned {validItems.Count} items. Customer balance increased by {returnDto.RefundAmount:C}.";
            result.TransferredCount = validItems.Count;

            return result;
        }

        public async Task<List<CustomerReturnHistoryDTO>> GetCustomerReturnRecordsAsync(int pageNumber = 1, int pageSize = 20)
        {
             var query = _context.CustomerReturnRecords
                .Include(r => r.Customer)
                .Include(r => r.ReturnItems)
                //.Include(r => r.User) // If User navigation exists. It might not be set up in DbContext yet based on context, so I'll be safe or assume it works if UserId is there. Actually User might be null.
                .AsNoTracking();

             // Order by date desc
             var records = await query
                .OrderByDescending(r => r.ReturnDate)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(r => new CustomerReturnHistoryDTO
                {
                    Id = r.Id,
                    ReturnDate = r.ReturnDate,
                    CustomerName = r.Customer != null ? r.Customer.Name : "Unknown",
                    ItemsCount = r.ReturnItems.Count,
                    RefundAmount = r.RefundAmount,
                    ProcessedBy = "System" // Placeholder until User claim/nav is fully linked
                })
                .ToListAsync();

             return records;
        }
    }
}