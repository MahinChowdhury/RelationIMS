using Relation_IMS.Models;

namespace Relation_IMS.Datas.Interfaces
{
    public interface IShareCatalogRepository
    {
        Task<ShareCatalog> CreateAsync(int ownerId, string password, DateTime expiresAt);
        Task<ShareCatalog?> GetByHashAsync(string hash);
        Task<bool> VerifyPasswordAsync(string hash, string password);
        Task<ShareCatalog?> GetValidCatalogWithPasswordAsync(string password);
        Task<bool> DeleteAsync(string hash, int ownerId);
        Task<List<ShareCatalog>> GetByOwnerIdAsync(int ownerId);
        Task<ShareCatalog?> UpdateExpiresAtAsync(string hash, int ownerId, DateTime newExpiresAt);
    }
}
