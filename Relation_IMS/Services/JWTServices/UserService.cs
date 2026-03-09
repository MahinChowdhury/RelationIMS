using Microsoft.EntityFrameworkCore;
using Relation_IMS.Entities;
using Relation_IMS.Dtos.JWTDtos;
using Relation_IMS.Models;
using Relation_IMS.Models.JWTModels;

namespace Relation_IMS.Services.JWTServices
{
    public class UserService : IUserService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITokenService _tokenService;
        private readonly IConfiguration _configuration;
        private readonly IClientCacheService _clientCacheService;

        public UserService(ApplicationDbContext dbContext, ITokenService tokenService, IConfiguration configuration, IClientCacheService clientCacheService)
        {
            _dbContext = dbContext;
            _tokenService = tokenService;
            _configuration = configuration;
            _clientCacheService = clientCacheService;
        }

        // Registers a new user
        public async Task<bool> RegisterUserAsync(UserRegisterDTO registerDto)
        {
            // Check if phone number already exists
            if (await _dbContext.Users.AnyAsync(u => u.PhoneNumber == registerDto.PhoneNumber))
                return false;

            var user = new User
            {
                Firstname = registerDto.Firstname,
                Lastname = registerDto.Lastname,
                Email = registerDto.Email ?? $"{registerDto.PhoneNumber}@placeholder.local",
                PhoneNumber = registerDto.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password),
                IsActive = true
            };

            // Assign default role "Salesman" to new registrations
            var defaultRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Salesman");
            if (defaultRole != null)
                user.UserRoles.Add(new UserRole { RoleId = defaultRole.Id, User = user });

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // Authenticates user login by phone number
        public async Task<AuthResponseDTO?> AuthenticateUserAsync(UserLoginDTO loginDto, string ipAddress)
        {
            var user = await _dbContext.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.PhoneNumber == loginDto.PhoneNumber && u.IsActive);

            if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                return null;

            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
            var client = await _clientCacheService.GetClientByClientIdAsync(loginDto.ClientId);
            if (client == null) return null;

            var accessToken = _tokenService.GenerateAccessToken(user, roles, out string jwtId, client);
            var refreshToken = _tokenService.GenerateRefreshToken(ipAddress, jwtId, client, user.Id);

            _dbContext.RefreshTokens.Add(refreshToken);
            await _dbContext.SaveChangesAsync();

            var accessTokenExpiryMinutes = int.TryParse(_configuration["JwtSettings:AccessTokenExpirationMinutes"], out var val) ? val : 15;

            return new AuthResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken.Token,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpiryMinutes)
            };
        }

        public async Task<AuthResponseDTO?> RefreshTokenAsync(string refreshToken, string clientId, string ipAddress)
        {
            var client = await _clientCacheService.GetClientByClientIdAsync(clientId);
            if (client == null) return null;

            var existingToken = await _dbContext.RefreshTokens
                .Include(rt => rt.User)
                .ThenInclude(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(rt => rt.Token == refreshToken && rt.ClientId == client.Id);

            if (existingToken == null || existingToken.IsRevoked || existingToken.Expires <= DateTime.UtcNow)
                return null;

            existingToken.IsRevoked = true;
            existingToken.RevokedAt = DateTime.UtcNow;

            var user = existingToken.User;
            var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();

            var accessToken = _tokenService.GenerateAccessToken(user, roles, out string newJwtId, client);
            var newRefreshToken = _tokenService.GenerateRefreshToken(ipAddress, newJwtId, client, user.Id);

            _dbContext.RefreshTokens.Add(newRefreshToken);
            await _dbContext.SaveChangesAsync();

            var accessTokenExpiryMinutes = int.TryParse(_configuration["JwtSettings:AccessTokenExpirationMinutes"], out var val) ? val : 15;

            return new AuthResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshToken.Token,
                AccessTokenExpiresAt = DateTime.UtcNow.AddMinutes(accessTokenExpiryMinutes)
            };
        }

        public async Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress)
        {
            var existingToken = await _dbContext.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == refreshToken);
            if (existingToken == null || existingToken.IsRevoked) return false;

            existingToken.IsRevoked = true;
            existingToken.RevokedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // Gets user info including role and preferences
        public async Task<UserInfoDTO?> GetUserInfoAsync(int userId)
        {
            var user = await _dbContext.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == userId && u.IsActive);

            if (user == null) return null;

            return new UserInfoDTO
            {
                Id = user.Id,
                Firstname = user.Firstname,
                Lastname = user.Lastname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                PreferredLanguage = user.PreferredLanguage,
                PreferredTheme = user.PreferredTheme,
                Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList()
            };
        }

        public async Task<bool> UpdatePreferredLanguageAsync(int userId, string language)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return false;

            var validLanguages = new[] { "en", "bn" };
            if (!validLanguages.Contains(language)) return false;

            user.PreferredLanguage = language;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdatePreferredThemeAsync(int userId, string theme)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return false;

            var validThemes = new[] { "light", "dark" };
            if (!validThemes.Contains(theme)) return false;

            user.PreferredTheme = theme;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        // ===== User Management (Admin) =====

        public async Task<List<UserListDTO>> GetAllUsersAsync(string? role = null, bool? isActive = null)
        {
            var query = _dbContext.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .AsQueryable();

            if (!string.IsNullOrEmpty(role))
            {
                query = query.Where(u => u.UserRoles.Any(ur => ur.Role.Name == role));
            }

            if (isActive.HasValue)
            {
                query = query.Where(u => u.IsActive == isActive.Value);
            }

            return await query
                .OrderByDescending(u => u.Id)
                .Select(u => new UserListDTO
                {
                    Id = u.Id,
                    Firstname = u.Firstname,
                    Lastname = u.Lastname,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    IsActive = u.IsActive,
                    PreferredLanguage = u.PreferredLanguage,
                    Role = u.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? ""
                })
                .ToListAsync();
        }

        public async Task<UserListDTO?> AdminCreateUserAsync(AdminCreateUserDTO dto)
        {
            // Check phone uniqueness
            if (await _dbContext.Users.AnyAsync(u => u.PhoneNumber == dto.PhoneNumber))
                return null;

            var user = new User
            {
                Firstname = dto.Firstname,
                Lastname = dto.Lastname,
                Email = dto.Email ?? $"{dto.PhoneNumber}@placeholder.local",
                PhoneNumber = dto.PhoneNumber,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                IsActive = true
            };

            // Assign single role
            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role);
            if (role != null)
                user.UserRoles.Add(new UserRole { RoleId = role.Id, User = user });
            else
            {
                // Default to Salesman
                var defaultRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == "Salesman");
                if (defaultRole != null)
                    user.UserRoles.Add(new UserRole { RoleId = defaultRole.Id, User = user });
            }

            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Create user profile with address and salary
            var userProfile = new Models.UserProfileModels.UserProfile
            {
                UserId = user.Id,
                Address = dto.Address,
                CurrentSalary = dto.CurrentSalary,
                JoinDate = DateTime.UtcNow
            };
            _dbContext.UserProfiles.Add(userProfile);
            await _dbContext.SaveChangesAsync();

            return new UserListDTO
            {
                Id = user.Id,
                Firstname = user.Firstname,
                Lastname = user.Lastname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                PreferredLanguage = user.PreferredLanguage,
                Role = user.UserRoles.Select(ur => ur.Role?.Name ?? "").FirstOrDefault() ?? ""
            };
        }

        public async Task<UserListDTO?> UpdateUserAsync(int userId, UserUpdateDTO dto)
        {
            var user = await _dbContext.Users
                .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
                .Include(u => u.UserProfile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return null;

            // Check phone uniqueness (excluding self)
            if (await _dbContext.Users.AnyAsync(u => u.PhoneNumber == dto.PhoneNumber && u.Id != userId))
                return null;

            user.Firstname = dto.Firstname;
            user.Lastname = dto.Lastname;
            user.PhoneNumber = dto.PhoneNumber;
            user.Email = dto.Email ?? user.Email;
            user.IsActive = dto.IsActive;

            // Update role: remove existing, assign new single role
            _dbContext.UserRoles.RemoveRange(user.UserRoles);
            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Name == dto.Role);
            if (role != null)
                _dbContext.UserRoles.Add(new UserRole { UserId = user.Id, RoleId = role.Id });

            // Update salary if provided
            if (dto.CurrentSalary.HasValue)
            {
                if (user.UserProfile == null)
                {
                    user.UserProfile = new Models.UserProfileModels.UserProfile
                    {
                        UserId = user.Id,
                        JoinDate = DateTime.UtcNow
                    };
                    _dbContext.UserProfiles.Add(user.UserProfile);
                }
                user.UserProfile.CurrentSalary = dto.CurrentSalary.Value;
            }

            await _dbContext.SaveChangesAsync();

            // Reload role
            await _dbContext.Entry(user).Collection(u => u.UserRoles).Query().Include(ur => ur.Role).LoadAsync();

            return new UserListDTO
            {
                Id = user.Id,
                Firstname = user.Firstname,
                Lastname = user.Lastname,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsActive = user.IsActive,
                PreferredLanguage = user.PreferredLanguage,
                Role = user.UserRoles.Select(ur => ur.Role.Name).FirstOrDefault() ?? ""
            };
        }

        public async Task<bool> DeleteUserAsync(int userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);
            if (user == null) return false;

            user.IsActive = false;
            await _dbContext.SaveChangesAsync();
            return true;
        }

        public async Task<List<RoleDTO>> GetAllRolesAsync()
        {
            return await _dbContext.Roles
                .OrderBy(r => r.Id)
                .Select(r => new RoleDTO
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description
                })
                .ToListAsync();
        }
    }
}
