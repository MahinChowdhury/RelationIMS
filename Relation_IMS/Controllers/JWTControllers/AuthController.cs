using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.JWTDtos;
using Relation_IMS.Services.JWTServices;

namespace Relation_IMS.Controllers.JWTControllers
{
    [ApiController]
    [Route("api/[controller]")]
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
    }
}
