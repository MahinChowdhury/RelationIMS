using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Models.ProductModels;
using Relation_IMS.Services;
using Relation_IMS.Filters;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/v1/[controller]")]
    public class ShareCatalogController : ControllerBase
    {
        private readonly IShareCatalogRepository _shareRepo;
        private readonly IProductRepository _productRepo;
        private readonly ICurrentUserService _currentUser;

        public ShareCatalogController(
            IShareCatalogRepository shareRepo,
            IProductRepository productRepo,
            ICurrentUserService currentUser)
        {
            _shareRepo = shareRepo;
            _productRepo = productRepo;
            _currentUser = currentUser;
        }

        [HttpPost]
        public async Task<IActionResult> CreateShareCatalog([FromBody] CreateShareCatalogRequest request)
        {
            if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 4)
            {
                return BadRequest(new { message = "Password must be at least 4 characters long." });
            }

            if (_currentUser.UserId == null)
            {
                return Unauthorized(new { message = "User not authenticated." });
            }

            var expiresAt = request.ExpiresAt ?? DateTime.UtcNow.AddDays(30);
            var shareCatalog = await _shareRepo.CreateAsync(_currentUser.UserId.Value, request.Password, expiresAt);

            return Ok(new
            {
                shareHash = shareCatalog.ShareHash,
                expiresAt = shareCatalog.ExpiresAt,
                message = "Share catalog created successfully."
            });
        }

        [HttpGet("{hash}")]
        [AllowAnonymous]
        [RedisCache("product")]
        public async Task<IActionResult> GetSharedProducts(
            string hash,
            [FromQuery] string? password,
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] string? stockOrder,
            [FromQuery] int brandId = -1,
            [FromQuery] int categoryId = -1,
            [FromQuery] int quarterId = -1,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            var shareCatalog = await _shareRepo.GetByHashAsync(hash);

            if (shareCatalog == null)
            {
                return NotFound(new { message = "Share catalog not found." });
            }

            if (shareCatalog.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "This share link has expired." });
            }

            if (string.IsNullOrEmpty(password))
            {
                return Ok(new
                {
                    requiresPassword = true,
                    message = "Password required to view this catalog."
                });
            }

            var isValid = await _shareRepo.VerifyPasswordAsync(hash, password);
            if (!isValid)
            {
                return Unauthorized(new { message = "Invalid password." });
            }

            var products = await _productRepo.GetAllProductsAsync(
                search,
                sortBy,
                stockOrder,
                brandId,
                categoryId,
                quarterId,
                pageNumber,
                pageSize);

            return Ok(new
            {
                requiresPassword = false,
                products = products
            });
        }

        [HttpGet("guest")]
        [AllowAnonymous]
        [RedisCache("product")]
        public async Task<IActionResult> GetGuestProducts(
            [FromQuery] string? password,
            [FromQuery] string? search,
            [FromQuery] string? sortBy,
            [FromQuery] string? stockOrder,
            [FromQuery] int brandId = -1,
            [FromQuery] int categoryId = -1,
            [FromQuery] int quarterId = -1,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 20)
        {
            if (string.IsNullOrEmpty(password))
            {
                return Ok(new
                {
                    requiresPassword = true,
                    message = "Password required to view this catalog."
                });
            }

            var shareCatalog = await _shareRepo.GetValidCatalogWithPasswordAsync(password);
            if (shareCatalog == null)
            {
                return Unauthorized(new { message = "Invalid password." });
            }

            var products = await _productRepo.GetAllProductsAsync(
                search,
                sortBy,
                stockOrder,
                brandId,
                categoryId,
                quarterId,
                pageNumber,
                pageSize);

            return Ok(new
            {
                requiresPassword = false,
                products = products
            });
        }

        [HttpPost("{hash}/verify")]
        [AllowAnonymous]
        public async Task<IActionResult> VerifyPassword(string hash, [FromBody] VerifyPasswordRequest request)
        {
            var shareCatalog = await _shareRepo.GetByHashAsync(hash);

            if (shareCatalog == null)
            {
                return NotFound(new { message = "Share catalog not found." });
            }

            if (shareCatalog.ExpiresAt < DateTime.UtcNow)
            {
                return BadRequest(new { message = "This share link has expired." });
            }

            var isValid = await _shareRepo.VerifyPasswordAsync(hash, request.Password);
            if (!isValid)
            {
                return Unauthorized(new { message = "Invalid password." });
            }

            return Ok(new { valid = true });
        }

        [HttpDelete("{hash}")]
        public async Task<IActionResult> DeleteShareCatalog(string hash)
        {
            if (_currentUser.UserId == null)
            {
                return Unauthorized(new { message = "User not authenticated." });
            }

            var deleted = await _shareRepo.DeleteAsync(hash, _currentUser.UserId.Value);

            if (!deleted)
            {
                return NotFound(new { message = "Share catalog not found or you are not the owner." });
            }

            return Ok(new { message = "Share catalog deleted successfully." });
        }

        [HttpPut("{hash}/expiresAt")]
        public async Task<IActionResult> UpdateExpiresAt(string hash, [FromBody] UpdateShareCatalogRequest request)
        {
            if (_currentUser.UserId == null)
            {
                return Unauthorized(new { message = "User not authenticated." });
            }

            if (request.ExpiresAt <= DateTime.UtcNow)
            {
                return BadRequest(new { message = "Expiration date must be in the future." });
            }

            var shareCatalog = await _shareRepo.UpdateExpiresAtAsync(hash, _currentUser.UserId.Value, request.ExpiresAt);

            if (shareCatalog == null)
            {
                return NotFound(new { message = "Share catalog not found or you are not the owner." });
            }

            return Ok(new { message = "Expiration date updated successfully.", expiresAt = shareCatalog.ExpiresAt });
        }

        [HttpGet]
        public async Task<IActionResult> GetMyShareCatalogs()
        {
            if (_currentUser.UserId == null)
            {
                return Unauthorized(new { message = "User not authenticated." });
            }

            var shares = await _shareRepo.GetByOwnerIdAsync(_currentUser.UserId.Value);

            return Ok(shares.Select(s => new
            {
                shareHash = s.ShareHash,
                password = s.Password,
                createdAt = s.CreatedAt,
                expiresAt = s.ExpiresAt,
                isExpired = s.ExpiresAt < DateTime.UtcNow
            }));
        }
    }

    public class CreateShareCatalogRequest
    {
        public string Password { get; set; } = null!;
        public DateTime? ExpiresAt { get; set; }
    }

    public class UpdateShareCatalogRequest
    {
        public DateTime ExpiresAt { get; set; }
    }

    public class VerifyPasswordRequest
    {
        public string Password { get; set; } = null!;
    }
}
