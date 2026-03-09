using Relation_IMS.Dtos.JWTDtos;

namespace Relation_IMS.Services.JWTServices
{
    public interface IUserService
    {
        Task<bool> RegisterUserAsync(UserRegisterDTO registerDto);
        Task<AuthResponseDTO?> AuthenticateUserAsync(UserLoginDTO loginDto, string ipAddress);
        Task<AuthResponseDTO?> RefreshTokenAsync(string refreshToken, string clientId, string ipAddress);
        Task<bool> RevokeRefreshTokenAsync(string refreshToken, string ipAddress);

        // User info & preferences
        Task<UserInfoDTO?> GetUserInfoAsync(int userId);
        Task<bool> UpdatePreferredLanguageAsync(int userId, string language);
        Task<bool> UpdatePreferredThemeAsync(int userId, string theme);

        // User management (admin)
        Task<List<UserListDTO>> GetAllUsersAsync(string? role = null, bool? isActive = null);
        Task<UserListDTO?> AdminCreateUserAsync(AdminCreateUserDTO dto);
        Task<UserListDTO?> UpdateUserAsync(int userId, UserUpdateDTO dto);
        Task<bool> DeleteUserAsync(int userId);
        Task<List<RoleDTO>> GetAllRolesAsync();
    }
}

