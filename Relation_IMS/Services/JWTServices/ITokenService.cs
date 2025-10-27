using Relation_IMS.Models;
using Relation_IMS.Models.JWTModels;

namespace Relation_IMS.Services.JWTServices
{
    public interface ITokenService
    {
        string GenerateAccessToken(User user, IList<string> roles, out string jwtId, Client client);
        RefreshToken GenerateRefreshToken(string ipAddress, string jwtId, Client client, int userId);
    }
}
