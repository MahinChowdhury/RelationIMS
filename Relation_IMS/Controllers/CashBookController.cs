using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.CashBookDtos;
using Relation_IMS.Filters;
using Relation_IMS.Models.AccountModels;
using Relation_IMS.Services;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class CashBookController : ControllerBase
    {
        private readonly ICashBookRepository _repo;
        private readonly IPdfReportService _pdfReportService;

        public CashBookController(ICashBookRepository repo, IPdfReportService pdfReportService)
        {
            _repo = repo;
            _pdfReportService = pdfReportService;
        }

        /// <summary>
        /// Get the ShopNo for the current user. Owner sees all (null), others see their shop only.
        /// </summary>
        private int? GetShopNoFilter()
        {
            if (User.IsInRole("Owner")) return null;
            var shopClaim = User.Claims.FirstOrDefault(c => c.Type == "ShopNo")?.Value;
            if (int.TryParse(shopClaim, out int shopNo))
            {
                if (shopNo == 0) return null;
                return shopNo;
            }
            return -1; // Non-owners without a shop see nothing
        }

        /// <summary>
        /// Get the current user's ShopNo (even for Owner, returns their actual shop).
        /// </summary>
        private int GetCurrentShopNo()
        {
            var shopClaim = User.Claims.FirstOrDefault(c => c.Type == "ShopNo")?.Value;
            if (int.TryParse(shopClaim, out int shopNo))
            {
                return shopNo;
            }
            return 0; // Default to Mother Shop for Owner
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            return int.TryParse(userIdClaim, out int userId) ? userId : 0;
        }

        // ──────────────────────────── GET Entries ────────────────────────────

        /// <summary>
        /// GET /api/v1/cashbook
        /// List cashbook entries. Owners can filter by shopNo, others see only their shop.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCashBookEntries(
            [FromQuery] int? shopNo,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null,
            [FromQuery] CashBookEntryType? entryType = null)
        {
            // Apply shop scoping
            var shopNoFilter = GetShopNoFilter();
            var effectiveShopNo = shopNoFilter ?? shopNo; // Owner can specify, others are forced

            var entries = await _repo.GetCashBookEntriesAsync(effectiveShopNo, startDate, endDate, pageNumber, pageSize, search, entryType);
            return Ok(entries);
        }

        // ──────────────────────────── GET Summary ────────────────────────────

        /// <summary>
        /// GET /api/v1/cashbook/summary
        /// Get summary cards data for a shop.
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetCashBookSummary(
            [FromQuery] int? shopNo,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var shopNoFilter = GetShopNoFilter();
            var effectiveShopNo = shopNoFilter ?? shopNo ?? GetCurrentShopNo();

            var summary = await _repo.GetCashBookSummaryAsync(effectiveShopNo, startDate, endDate);
            return Ok(summary);
        }

        /// <summary>
        /// GET /api/v1/cashbook/export/pdf
        /// Export Cashbook for a specific day and shop as PDF.
        /// </summary>
        [HttpGet("export/pdf")]
        public async Task<IActionResult> ExportCashBookPdf([FromQuery] DateTime date, [FromQuery] int? shopNo, [FromQuery] string shopName = "Shop")
        {
            try
            {
                var shopNoFilter = GetShopNoFilter();
                var effectiveShopNo = shopNoFilter ?? shopNo ?? GetCurrentShopNo();

                var pdfBytes = await _pdfReportService.GenerateCashBookReportAsync(date, effectiveShopNo, shopName);
                return File(pdfBytes, "application/pdf", $"CashBook_{shopName}_{date:yyyyMMdd}.pdf");
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to generate PDF.", error = ex.Message });
            }
        }

        // ──────────────────────────── POST Manual Entry ────────────────────────────

        /// <summary>
        /// POST /api/v1/cashbook/entry
        /// Create a manual cashbook entry.
        /// </summary>
        [HttpPost("entry")]
        public async Task<IActionResult> CreateManualEntry([FromBody] CreateManualEntryDTO dto, [FromQuery] int? shopNo)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if ((dto.CashIn == null || dto.CashIn == 0) && (dto.CashOut == null || dto.CashOut == 0))
                return BadRequest(new { message = "Either CashIn or CashOut must be provided." });

            if (dto.CashIn > 0 && dto.CashOut > 0)
                return BadRequest(new { message = "Provide either CashIn or CashOut, not both." });

            var effectiveShopNo = GetShopNoFilter() ?? shopNo ?? GetCurrentShopNo();
            var userId = GetCurrentUserId();

            try
            {
                var entry = await _repo.CreateManualEntryAsync(effectiveShopNo, userId, dto);
                return Ok(entry);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ──────────────────────────── DELETE Entry ────────────────────────────

        /// <summary>
        /// DELETE /api/v1/cashbook/{id}
        /// Deletes a manual cashbook entry and recalculates all subsequent balances.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEntry(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _repo.DeleteEntryAsync(id, userId);
                return Ok(new { message = "Entry deleted successfully and balances recalculated." });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while deleting the entry.", error = ex.Message });
            }
        }

        // ──────────────────────────── PUT Entry ────────────────────────────

        /// <summary>
        /// PUT /api/v1/cashbook/{id}
        /// Edits a manual cashbook entry and recalculates all subsequent balances.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> EditEntry(int id, [FromBody] CreateManualEntryDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if ((dto.CashIn == null || dto.CashIn == 0) && (dto.CashOut == null || dto.CashOut == 0))
                return BadRequest(new { message = "Either CashIn or CashOut must be provided." });

            if (dto.CashIn > 0 && dto.CashOut > 0)
                return BadRequest(new { message = "Provide either CashIn or CashOut, not both." });

            try
            {
                var userIdStr = User.Claims.FirstOrDefault(c => c.Type == "id")?.Value;
                if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

                var entry = await _repo.EditEntryAsync(id, userId, dto);
                return Ok(entry);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred while editing the entry.", error = ex.Message });
            }
        }

        // ──────────────────────────── POST Transfer ────────────────────────────

        /// <summary>
        /// POST /api/v1/cashbook/transfer
        /// Transfer money from the current shop to Mother Shop.
        /// </summary>
        [HttpPost("transfer")]
        public async Task<IActionResult> TransferToMotherShop([FromBody] CreateCashTransferDTO dto, [FromQuery] int? shopNo)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var shopNoFilter = GetShopNoFilter();
            var effectiveShopNo = shopNoFilter ?? shopNo ?? GetCurrentShopNo();
            var userId = GetCurrentUserId();

            if (effectiveShopNo == 0)
            {
                return BadRequest(new { message = "Mother Shop cannot transfer to itself." });
            }

            try
            {
                var transfer = await _repo.TransferToMotherShopAsync(effectiveShopNo, userId, dto);
                return Ok(new { message = "Transfer completed successfully.", transfer });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ──────────────────────────── GET Transfers ────────────────────────────

        /// <summary>
        /// GET /api/v1/cashbook/transfers
        /// Get transfer history.
        /// </summary>
        [HttpGet("transfers")]
        public async Task<IActionResult> GetTransferHistory(
            [FromQuery] int? shopNo,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var shopNoFilter = GetShopNoFilter();
            var effectiveShopNo = shopNoFilter ?? shopNo;

            var transfers = await _repo.GetTransferHistoryAsync(effectiveShopNo, pageNumber, pageSize);
            return Ok(transfers);
        }

        // ──────────────────────────── POST Opening Balance ────────────────────────────

        /// <summary>
        /// POST /api/v1/cashbook/opening-balance
        /// Set opening balance for a shop (Owner only).
        /// </summary>
        [HttpPost("opening-balance")]
        public async Task<IActionResult> SetOpeningBalance([FromBody] SetOpeningBalanceDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!User.IsInRole("Owner"))
                return Forbid();

            var userId = GetCurrentUserId();

            try
            {
                var entry = await _repo.SetOpeningBalanceAsync(userId, dto);
                return Ok(new { message = "Opening balance set successfully.", entry });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // ──────────────────────────── GET Balance ────────────────────────────

        /// <summary>
        /// GET /api/v1/cashbook/balance/{shopNo}
        /// Get the current balance for a shop.
        /// </summary>
        [HttpGet("balance/{shopNo:int}")]
        public async Task<IActionResult> GetCurrentBalance(int shopNo)
        {
            var shopNoFilter = GetShopNoFilter();
            if (shopNoFilter.HasValue && shopNoFilter.Value != shopNo)
            {
                return Forbid();
            }

            var balance = await _repo.GetLatestBalanceAsync(shopNo);
            return Ok(new { shopNo, balance });
        }
    }
}
