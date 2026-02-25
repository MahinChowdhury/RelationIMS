using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.JWTDtos;
using Relation_IMS.Services.JWTServices;
using System.Security.Claims;

namespace Relation_IMS.Controllers.JWTControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        // Constructor receives IUserService via Dependency Injection
        public AuthController(IUserService userService)
        {
            _userService = userService;
        }
        // POST api/auth/register
        // Endpoint for user registration
        [HttpPost("register")]
        public async Task<IActionResult> Register(UserRegisterDTO registerDto)
        {
            // Validate input model (e.g., required fields, formats)
            if (!ModelState.IsValid)
                return BadRequest(ModelState); // Return 400 with validation errors
                                               // Call UserService to register user
            var success = await _userService.RegisterUserAsync(registerDto);
            // If registration fails (email exists), return 400 with custom message
            if (!success)
                return BadRequest(new { message = "Email already exists." });
            // Successful registration: return 200 OK with success message
            return Ok(new { message = "User registered successfully." });
        }
        // POST api/auth/login
        // Endpoint for user login and JWT token generation
        [HttpPost("login")]
        public async Task<IActionResult> Login(UserLoginDTO loginDto)
        {
            // Validate input model (email, password, clientId)
            if (!ModelState.IsValid)
                return BadRequest(ModelState); // Return 400 with validation errors
                                               // Get client IP address for logging and refresh token generation
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            // Call UserService to authenticate user and get JWT + refresh tokens
            var authResponse = await _userService.AuthenticateUserAsync(loginDto, ipAddress);
            // If authentication fails (invalid credentials or client), return 401 Unauthorized
            if (authResponse == null)
                return Unauthorized(new { message = "Invalid credentials or client." });
            // Successful login: return 200 OK with tokens and expiry info
            return Ok(authResponse);
        }
        // POST api/auth/refresh-token
        // Endpoint to obtain a new access token using a refresh token
        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken(RefreshTokenRequestDTO refreshRequest)
        {
            // Validate input model (refreshToken and clientId required)
            if (!ModelState.IsValid)
                return BadRequest(ModelState); // Return 400 with validation errors
                                               // Get client IP address (optional for logging/auditing)
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            // Call UserService to validate refresh token and issue new access & refresh tokens
            var authResponse = await _userService.RefreshTokenAsync(refreshRequest.RefreshToken, refreshRequest.ClientId, ipAddress);
            // If refresh token or client is invalid, return 401 Unauthorized
            if (authResponse == null)
                return Unauthorized(new { message = "Invalid refresh token or client." });
            // Successful token refresh: return 200 OK with new tokens and expiry info
            return Ok(authResponse);
        }

        // GET api/auth/me
        // Returns user info including preferences
        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetUserInfo()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var userInfo = await _userService.GetUserInfoAsync(userId.Value);
            if (userInfo == null) return NotFound();

            return Ok(userInfo);
        }

        // PUT api/auth/me/language
        // Updates the user's preferred language
        [Authorize]
        [HttpPut("me/language")]
        public async Task<IActionResult> UpdateLanguage([FromBody] UserPreferenceDTO preference)
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var success = await _userService.UpdatePreferredLanguageAsync(userId.Value, preference.PreferredLanguage);
            if (!success) return BadRequest(new { message = "Invalid language code. Supported: en, bn" });

            return Ok(new { message = "Language preference updated.", preferredLanguage = preference.PreferredLanguage });
        }

        // GET api/auth/me/language
        // Gets the user's preferred language
        [Authorize]
        [HttpGet("me/language")]
        public async Task<IActionResult> GetLanguage()
        {
            var userId = GetCurrentUserId();
            if (userId == null) return Unauthorized();

            var userInfo = await _userService.GetUserInfoAsync(userId.Value);
            if (userInfo == null) return NotFound();

            return Ok(new { preferredLanguage = userInfo.PreferredLanguage });
        }

        // Helper: Extract current user Id from JWT claims
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                           ?? User.FindFirst("sub")?.Value;
            if (int.TryParse(userIdClaim, out var userId))
                return userId;
            return null;
        }
    }
}
