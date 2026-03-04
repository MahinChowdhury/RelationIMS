using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Relation_IMS.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        private ClaimsPrincipal? User => _httpContextAccessor.HttpContext?.User;

        public bool IsAuthenticated => User?.Identity?.IsAuthenticated ?? false;

        public int? UserId
        {
            get
            {
                var sub = User?.FindFirstValue(ClaimTypes.NameIdentifier);
                return int.TryParse(sub, out var id) ? id : null;
            }
        }

        public string? Email => User?.FindFirstValue(JwtRegisteredClaimNames.Email);

        public string? ClientId => User?.FindFirstValue("client_id");

        public IReadOnlyList<string> Roles =>
            User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList().AsReadOnly()
            ?? new List<string>().AsReadOnly();
    }
}
