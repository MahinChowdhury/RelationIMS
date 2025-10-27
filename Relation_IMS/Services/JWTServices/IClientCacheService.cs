using Relation_IMS.Models.JWTModels;

namespace Relation_IMS.Services.JWTServices
{
    public interface IClientCacheService
    {
        Task<Client?> GetClientByClientIdAsync(string clientId); 
    }
}
