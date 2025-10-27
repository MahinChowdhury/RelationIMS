using Microsoft.EntityFrameworkCore;
using Relation_IMS.Entities;
using Relation_IMS.Dtos.JWTDtos;
using Relation_IMS.Models;
using Relation_IMS.Models.JWTModels;

namespace Relation_IMS.Services.JWTServices
{
    public class UserService : IUserService
    {
        // EF Core DbContext for database operations
        private readonly ApplicationDbContext _dbContext;
        // Service for generating and validating JWT tokens
        private readonly ITokenService _tokenService;
        // For accessing configuration values like token expiration time
        private readonly IConfiguration _configuration;
        // Cache service to quickly get Client info without DB calls every time
        private readonly IClientCacheService _clientCacheService;
        // Constructor injects dependencies via Dependency Injection
        public UserService(ApplicationDbContext dbContext, ITokenService tokenService, IConfiguration configuration, IClientCacheService clientCacheService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
            _configuration = configuration;
            _clientCacheService = clientCacheService;
        }
        // Registers a new user with details from UserRegisterDTO
        public async Task<bool> RegisterUserAsync(UserRegisterDTO registerDto)
        {
            // Check if a user with the same email already exists to enforce unique emails
            if (await _dbContext.Users.AnyAsync(u => u.Email == registerDto.Email))
                return false; // Registration fails if email is already taken
                              // Create new User entity, hash the password using BCrypt for security
            var user = new User
            {
                Firstname = registerDto.Firstname,
                Lastname = registerDto.Lastname,
                Email = registerDto.Email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                IsActive = true
            };
            // Assign default role "User" to new users
            var userRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "User");
            if (userRole != null)
                user.UserRoles.Add(new UserRole { RoleId = userRole.Id, User = user });
            // Add the new user entity to the DbContext and save changes to the database
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();
            return true; // Registration succeeded
        }
        // Authenticates user login and returns tokens if successful
        public async Task<AuthResponseDTO?> AuthenticateUserAsync(UserLoginDTO loginDto, string ipAddress)
        {
            // Retrieve user by email with roles eagerly loaded; only active users allowed
            var user = await _dbContext.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email && u.IsActive);
            // Verify user exists and password matches the stored hashed password
            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                return null; // Invalid credentials
                             // Extract list of role names for inclusion in JWT claims
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            // Retrieve client info by ClientId
            var client = await _clientCacheService.GetClientByClientIdAsync(loginDto.ClientId);
            if (client == null)
            {
                // Fail if client does not exist or is inactive
                return null;
            }
            // Generate JWT access token with user details, roles, and client info
            var accessToken = _tokenService.GenerateAccessToken(user, roles, out string jwtId, client);
            // Generate refresh token linked to the generated JWT ID, client, user, and IP address
            var refreshToken = _tokenService.GenerateRefreshToken(ipAddress, jwtId, client, user.Id);
            // Store the refresh token in the database for later validation and refresh workflows
            _dbContext.RefreshTokens.Add(refreshToken);
            await _dbContext.SaveChangesAsync();
            // Read access token expiration duration from config or fallback to 15 minutes
            var accessTokenExpiryMinutes = int.TryParse(_configuration["JwtSettings:AccessTokenExpirationMinutes"], out var val) ? val : 15;
            // Return the tokens and expiry info encapsulated in AuthResponseDTO
            return new AuthResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpiryMinutes)
            };
        }
        // Refreshes an expired access token using a valid refresh token and client ID
        public async Task<AuthResponseDTO?> RefreshTokenAsync(string refreshToken, string clientId, string ipAddress)
        {
            // Retrieve client info by clientId for validation
            var client = await _clientCacheService.GetClientByClientIdAsync(clientId);
            if (client == null)
            {
                // Client invalid or inactive; reject refresh
                return null;
            }
            // Look up the refresh token in database, including related user and roles for new token generation
            var existingToken = await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.ClientId == client.Id);
            // Validate refresh token existence, revocation status, and expiration
            if (existingToken == null || existingToken.IsRevoked || existingToken.Expires <= DateTime.UtcNow)
                return null; // Invalid refresh token
                             // Revoke old refresh token immediately to prevent reuse
            existingToken.IsRevoked = true;
            existingToken.RevokedAt = DateTime.UtcNow;
            var user = existingToken.User;
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            // Generate a new access token with fresh JWT ID and client info
            var accessToken = _tokenService.GenerateAccessToken(user, roles, out string newJwtId, client);
            // Generate a new refresh token linked to the new JWT ID
            var newRefreshToken = _tokenService.GenerateRefreshToken(ipAddress, newJwtId, client, user.Id);
            // Store the new refresh token in the database
            _dbContext.RefreshTokens.Add(newRefreshToken);
            await _dbContext.SaveChangesAsync();
            // Read access token expiration duration from config or default to 15 minutes
            var accessTokenExpiryMinutes = int.TryParse(_configuration["JwtSettings:AccessTokenExpirationMinutes"], out var val) ? val : 15;
            // Return the new tokens and expiry info
            return new AuthResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken.Token,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpiryMinutes)
            };
        }
        // Revokes an existing refresh token to prevent further use
        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress)
        {
            // Look up the refresh token in the database
            var existingToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
            // Return false if token not found or already revoked
            if (existingToken == null || existingToken.IsRevoked)
                return false;
            // Mark token as revoked and record revocation time
            existingToken.IsRevoked = true;
            existingToken.RevokedAt = DateTime.UtcNow;
            // Persist changes to database
            await _dbContext.SaveChangesAsync();
            return true; // Indicate successful revocation
        }
    }
}
