using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CashBookDtos;
using Relation_IMS.Entities;
using Relation_IMS.Models.AccountModels;
using Relation_IMS.Services;

namespace Relation_IMS.Datas.Repositories
{
    public class CashBookRepository : ICashBookRepository
    {
        private readonly ApplicationDbContext _context;
        private readonly IConcurrencyLockService _lockService;

        public CashBookRepository(ApplicationDbContext context, IConcurrencyLockService lockService)
        {
            _context = context;
            _lockService = lockService;
        }

        // ──────────────────────────── Queries ────────────────────────────

        public async Task<List<CashBookEntryResponseDTO>> GetCashBookEntriesAsync(
            int? shopNo, DateTime? startDate, DateTime? endDate,
            int pageNumber = 1, int pageSize = 20,
            string? search = null, CashBookEntryType? entryType = null)
        {
            var query = _context.CashBookEntries
                .Include(e => e.User)
                .Include(e => e.OrderPayment)
                .AsQueryable();

            if (shopNo.HasValue)
            {
                query = query.Where(e => e.ShopNo == shopNo.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(e => e.TransactionDate.Date >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.TransactionDate.Date <= endDate.Value.Date);
            }

            if (entryType.HasValue)
            {
                query = query.Where(e => e.EntryType == entryType.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.ToLower();
                query = query.Where(e =>
                    e.ReferenceNo.ToLower().Contains(term) ||
                    e.TransactionType.ToLower().Contains(term) ||
                    (e.Description != null && e.Description.ToLower().Contains(term)) ||
                    (e.Note != null && e.Note.ToLower().Contains(term)));
            }

            var entries = await query
                .OrderBy(e => e.TransactionDate)
                .ThenBy(e => e.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new CashBookEntryResponseDTO
                {
                    Id = e.Id,
                    ReferenceNo = e.ReferenceNo,
                    EntryType = e.EntryType.ToString(),
                    TransactionType = e.TransactionType,
                    Description = e.Description,
                    CashIn = e.CashIn,
                    CashOut = e.CashOut,
                    RunningBalance = e.RunningBalance,
                    OrderId = e.OrderId,
                    OrderPaymentId = e.OrderPaymentId,
                    PaymentMethod = e.OrderPayment != null ? e.OrderPayment.PaymentMethod.ToString() : null,
                    CashTransferId = e.CashTransferId,
                    Note = e.Note,
                    TransactionDate = e.TransactionDate,
                    CreatedAt = e.CreatedAt,
                    ShopNo = e.ShopNo,
                    UserId = e.UserId,
                    UserName = e.User != null ? e.User.Firstname : null
                })
                .ToListAsync();

            return entries;
        }

        public async Task<CashBookSummaryDTO> GetCashBookSummaryAsync(int shopNo, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.CashBookEntries
                .Where(e => e.ShopNo == shopNo);

            // Calculate opening balance: balance just before the start date
            decimal openingBalance = 0;
            if (startDate.HasValue)
            {
                var lastEntryBeforePeriod = await _context.CashBookEntries
                    .Where(e => e.ShopNo == shopNo && e.TransactionDate.Date < startDate.Value.Date)
                    .OrderByDescending(e => e.TransactionDate)
                    .ThenByDescending(e => e.Id)
                    .FirstOrDefaultAsync();

                openingBalance = lastEntryBeforePeriod?.RunningBalance ?? 0;

                query = query.Where(e => e.TransactionDate.Date >= startDate.Value.Date);
            }

            if (endDate.HasValue)
            {
                query = query.Where(e => e.TransactionDate.Date <= endDate.Value.Date);
            }

            var entries = await query.ToListAsync();

            var totalCashIn = entries.Sum(e => e.CashIn ?? 0);
            var totalCashOut = entries.Sum(e => e.CashOut ?? 0);

            return new CashBookSummaryDTO
            {
                OpeningBalance = openingBalance,
                TotalCashIn = totalCashIn,
                TotalCashOut = totalCashOut,
                ClosingBalance = openingBalance + totalCashIn - totalCashOut,
                EntryCount = entries.Count,
                PeriodLabel = startDate.HasValue && endDate.HasValue
                    ? $"{startDate.Value:MMM dd, yyyy} – {endDate.Value:MMM dd, yyyy}"
                    : "All Time"
            };
        }

        public async Task<decimal> GetLatestBalanceAsync(int shopNo)
        {
            var lastEntry = await _context.CashBookEntries
                .Where(e => e.ShopNo == shopNo)
                .OrderByDescending(e => e.TransactionDate)
                .ThenByDescending(e => e.Id)
                .FirstOrDefaultAsync();

            return lastEntry?.RunningBalance ?? 0;
        }

        // ──────────────────────────── Manual Entry ────────────────────────────

        public async Task<CashBookEntry> CreateManualEntryAsync(int shopNo, int userId, CreateManualEntryDTO dto)
        {
            using (await _lockService.AcquireLockAsync($"cashbook:{shopNo}"))
            {
                var currentBalance = await GetLatestBalanceAsync(shopNo);

                var cashIn = dto.CashIn ?? 0;
                var cashOut = dto.CashOut ?? 0;
                var newBalance = currentBalance + cashIn - cashOut;

                var entryType = cashIn > 0 ? CashBookEntryType.ManualCashIn : CashBookEntryType.ManualCashOut;

                var entry = new CashBookEntry
                {
                    ShopNo = shopNo,
                    ReferenceNo = await GenerateReferenceNoAsync(shopNo),
                    EntryType = entryType,
                    TransactionType = dto.TransactionType,
                    Description = dto.Description,
                    CashIn = cashIn > 0 ? cashIn : null,
                    CashOut = cashOut > 0 ? cashOut : null,
                    RunningBalance = newBalance,
                    UserId = userId,
                    Note = dto.Note,
                    TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(entry);
                await _context.SaveChangesAsync();

                return entry;
            }
        }

        // ──────────────────────────── Auto: Order Payment ────────────────────────────

        public async Task RecordOrderPaymentEntryAsync(int shopNo, int userId, int orderId, int orderPaymentId, decimal amount, bool isDuePayment, PaymentMethod paymentMethod)
        {
            using (await _lockService.AcquireLockAsync($"cashbook:{shopNo}"))
            {
                var currentBalance = await GetLatestBalanceAsync(shopNo);
                var newBalance = currentBalance + amount;

                var entry = new CashBookEntry
                {
                    ShopNo = shopNo,
                    ReferenceNo = await GenerateReferenceNoAsync(shopNo),
                    EntryType = isDuePayment ? CashBookEntryType.DuePayment : CashBookEntryType.OrderPayment,
                    TransactionType = isDuePayment ? "Due Collection" : "Order Payment",
                    Description = isDuePayment
                        ? $"Due payment received for Order #{orderId}"
                        : $"{paymentMethod} payment received for Order #{orderId}",
                    CashIn = amount,
                    CashOut = null,
                    RunningBalance = newBalance,
                    OrderPaymentId = orderPaymentId,
                    OrderId = orderId,
                    UserId = userId,
                    TransactionDate = DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(entry);
                await _context.SaveChangesAsync();
            }
        }

        // ──────────────────────────── Auto: Refund ────────────────────────────

        public async Task RecordRefundEntryAsync(int shopNo, int userId, int? orderId, decimal refundAmount)
        {
            using (await _lockService.AcquireLockAsync($"cashbook:{shopNo}"))
            {
                var currentBalance = await GetLatestBalanceAsync(shopNo);
                var newBalance = currentBalance - refundAmount;

                var entry = new CashBookEntry
                {
                    ShopNo = shopNo,
                    ReferenceNo = await GenerateReferenceNoAsync(shopNo),
                    EntryType = CashBookEntryType.Refund,
                    TransactionType = "Customer Refund",
                    Description = orderId.HasValue
                        ? $"Refund issued for Order #{orderId}"
                        : "Customer refund processed",
                    CashIn = null,
                    CashOut = refundAmount,
                    RunningBalance = newBalance,
                    OrderId = orderId,
                    UserId = userId,
                    TransactionDate = DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(entry);
                await _context.SaveChangesAsync();
            }
        }

        // ──────────────────────────── Transfer to Mother Shop ────────────────────────────

        public async Task<CashTransfer> TransferToMotherShopAsync(int fromShopNo, int userId, CreateCashTransferDTO dto)
        {
            // Lock both shops to prevent race conditions
            var firstLock = Math.Min(fromShopNo, 0);
            var secondLock = Math.Max(fromShopNo, 0);

            using (await _lockService.AcquireLockAsync($"cashbook:{firstLock}"))
            using (await _lockService.AcquireLockAsync($"cashbook:{secondLock}"))
            {
                // Verify source shop has enough balance
                var sourceBalance = await GetLatestBalanceAsync(fromShopNo);
                if (sourceBalance < dto.Amount)
                {
                    throw new InvalidOperationException(
                        $"Insufficient balance. Current balance: ৳{sourceBalance:N2}, Transfer amount: ৳{dto.Amount:N2}");
                }

                // Create the transfer record
                var transfer = new CashTransfer
                {
                    FromShopNo = fromShopNo,
                    ToShopNo = 0,
                    Amount = dto.Amount,
                    Note = dto.Note,
                    UserId = userId,
                    TransferDate = dto.TransactionDate ?? DateTime.UtcNow,
                    Status = CashTransferStatus.Completed
                };

                await _context.CashTransfers.AddAsync(transfer);
                await _context.SaveChangesAsync();

                // Create TransferOut entry in source shop
                var sourceNewBalance = sourceBalance - dto.Amount;
                var sourceEntry = new CashBookEntry
                {
                    ShopNo = fromShopNo,
                    ReferenceNo = await GenerateReferenceNoAsync(fromShopNo),
                    EntryType = CashBookEntryType.TransferOut,
                    TransactionType = "Transfer to HQ",
                    Description = $"Cash transfer to Mother Shop",
                    CashIn = null,
                    CashOut = dto.Amount,
                    RunningBalance = sourceNewBalance,
                    CashTransferId = transfer.Id,
                    UserId = userId,
                    Note = dto.Note,
                    TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(sourceEntry);

                // Create TransferIn entry in Mother Shop (ShopNo = 0)
                var motherBalance = await GetLatestBalanceAsync(0);
                var motherNewBalance = motherBalance + dto.Amount;
                var motherEntry = new CashBookEntry
                {
                    ShopNo = 0,
                    ReferenceNo = await GenerateReferenceNoAsync(0),
                    EntryType = CashBookEntryType.TransferIn,
                    TransactionType = "Transfer from Shop",
                    Description = $"Cash received from Shop #{fromShopNo}",
                    CashIn = dto.Amount,
                    CashOut = null,
                    RunningBalance = motherNewBalance,
                    CashTransferId = transfer.Id,
                    UserId = userId,
                    Note = dto.Note,
                    TransactionDate = dto.TransactionDate ?? DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(motherEntry);
                await _context.SaveChangesAsync();

                return transfer;
            }
        }

        // ──────────────────────────── Transfer History ────────────────────────────

        public async Task<List<CashTransfer>> GetTransferHistoryAsync(int? shopNo, int pageNumber = 1, int pageSize = 20)
        {
            var query = _context.CashTransfers
                .Include(t => t.User)
                .AsQueryable();

            if (shopNo.HasValue)
            {
                query = query.Where(t => t.FromShopNo == shopNo.Value || t.ToShopNo == shopNo.Value);
            }

            return await query
                .OrderByDescending(t => t.TransferDate)
                .ThenByDescending(t => t.Id)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        // ──────────────────────────── Opening Balance ────────────────────────────

        public async Task<CashBookEntry> SetOpeningBalanceAsync(int userId, SetOpeningBalanceDTO dto)
        {
            using (await _lockService.AcquireLockAsync($"cashbook:{dto.ShopNo}"))
            {
                // Check if an opening balance already exists for this shop
                var existingOpening = await _context.CashBookEntries
                    .AnyAsync(e => e.ShopNo == dto.ShopNo && e.EntryType == CashBookEntryType.OpeningBalance);

                if (existingOpening)
                {
                    throw new InvalidOperationException(
                        $"Opening balance already set for Shop #{dto.ShopNo}. Use a manual adjustment entry instead.");
                }

                var entry = new CashBookEntry
                {
                    ShopNo = dto.ShopNo,
                    ReferenceNo = await GenerateReferenceNoAsync(dto.ShopNo),
                    EntryType = CashBookEntryType.OpeningBalance,
                    TransactionType = "Opening Balance",
                    Description = $"Initial opening balance for Shop #{dto.ShopNo}",
                    CashIn = dto.Amount,
                    CashOut = null,
                    RunningBalance = dto.Amount,
                    UserId = userId,
                    TransactionDate = DateTime.UtcNow
                };

                await _context.CashBookEntries.AddAsync(entry);
                await _context.SaveChangesAsync();

                return entry;
            }
        }

        // ──────────────────────────── Deletion & Recalculation ────────────────────────────

        public async Task DeleteEntryAsync(int id, int userId)
        {
            var entry = await _context.CashBookEntries.FindAsync(id);
            if (entry == null) throw new KeyNotFoundException("Cashbook entry not found.");

            if (entry.EntryType != CashBookEntryType.ManualCashIn && 
                entry.EntryType != CashBookEntryType.ManualCashOut && 
                entry.EntryType != CashBookEntryType.OpeningBalance)
            {
                throw new InvalidOperationException("Only manual entries or opening balances can be deleted directly. System-generated entries (like sales or transfers) must be reversed through their respective modules.");
            }

            if ((DateTime.UtcNow - entry.TransactionDate).TotalDays > 7)
            {
                throw new InvalidOperationException("Entries cannot be deleted after 7 days.");
            }

            var shopNo = entry.ShopNo;

            using (await _lockService.AcquireLockAsync($"cashbook:{shopNo}"))
            {
                _context.CashBookEntries.Remove(entry);
                await _context.SaveChangesAsync();

                await RecalculateBalancesAsync(shopNo);
            }
        }

        public async Task<CashBookEntry> EditEntryAsync(int id, int userId, CreateManualEntryDTO dto)
        {
            var entry = await _context.CashBookEntries.FindAsync(id);
            if (entry == null) throw new KeyNotFoundException("Cashbook entry not found.");

            if (entry.EntryType != CashBookEntryType.ManualCashIn && 
                entry.EntryType != CashBookEntryType.ManualCashOut && 
                entry.EntryType != CashBookEntryType.OpeningBalance)
            {
                throw new InvalidOperationException("Only manual entries or opening balances can be edited.");
            }

            if ((DateTime.UtcNow - entry.TransactionDate).TotalDays > 7)
            {
                throw new InvalidOperationException("Entries cannot be edited after 7 days.");
            }

            var shopNo = entry.ShopNo;

            using (await _lockService.AcquireLockAsync($"cashbook:{shopNo}"))
            {
                var cashIn = dto.CashIn ?? 0;
                var cashOut = dto.CashOut ?? 0;

                entry.EntryType = cashIn > 0 ? CashBookEntryType.ManualCashIn : CashBookEntryType.ManualCashOut;
                entry.TransactionType = dto.TransactionType;
                entry.Description = dto.Description;
                entry.CashIn = dto.CashIn;
                entry.CashOut = dto.CashOut;
                entry.Note = dto.Note;
                entry.UserId = userId; // Track who last edited

                await _context.SaveChangesAsync();

                await RecalculateBalancesAsync(shopNo);
            }

            return entry;
        }

        private async Task RecalculateBalancesAsync(int shopNo)
        {
            var allEntries = await _context.CashBookEntries
                .Where(e => e.ShopNo == shopNo)
                .OrderBy(e => e.TransactionDate)
                .ThenBy(e => e.Id)
                .ToListAsync();

            decimal running = 0;
            foreach (var e in allEntries)
            {
                running += (e.CashIn ?? 0) - (e.CashOut ?? 0);
                if (e.RunningBalance != running)
                {
                    e.RunningBalance = running;
                }
            }

            await _context.SaveChangesAsync();
        }

        // ──────────────────────────── Helpers ────────────────────────────

        /// <summary>
        /// Generates a unique reference number: CB-{sequence:D5}
        /// </summary>
        private async Task<string> GenerateReferenceNoAsync(int shopNo)
        {
            // Just use a simple, globally incrementing number for brevity
            var totalCount = await _context.CashBookEntries.CountAsync();
            var sequence = totalCount + 1;
            return $"CB-{sequence:D5}";
        }
    }
}
