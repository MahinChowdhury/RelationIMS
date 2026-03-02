using Microsoft.EntityFrameworkCore;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Entities;
using Relation_IMS.Models;

namespace Relation_IMS.Datas.Repositories
{
    public class ShareCatalogRepository : IShareCatalogRepository
    {
        private readonly ApplicationDbContext _context;

        public ShareCatalogRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ShareCatalog> CreateAsync(int ownerId, string password)
        {
            var shareCatalog = new ShareCatalog
            {
                ShareHash = Guid.NewGuid().ToString("N"),
                OwnerId = ownerId,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                ExpiresAt = DateTime.UtcNow.AddDays(30)
            };

            _context.ShareCatalogs.Add(shareCatalog);
            await _context.SaveChangesAsync();

            return shareCatalog;
        }

        public async Task<ShareCatalog?> GetByHashAsync(string hash)
        {
            return await _context.ShareCatalogs
                .Include(sc => sc.Owner)
                .FirstOrDefaultAsync(sc => sc.ShareHash == hash);
        }

        public async Task<bool> VerifyPasswordAsync(string hash, string password)
        {
            var shareCatalog = await _context.ShareCatalogs
                .FirstOrDefaultAsync(sc => sc.ShareHash == hash);

            if (shareCatalog == null)
                return false;

            if (shareCatalog.ExpiresAt < DateTime.UtcNow)
                return false;

            return BCrypt.Net.BCrypt.Verify(password, shareCatalog.PasswordHash);
        }

        public async Task<ShareCatalog?> GetValidCatalogWithPasswordAsync(string password)
        {
            var shareCatalogs = await _context.ShareCatalogs
                .Where(sc => sc.ExpiresAt > DateTime.UtcNow)
                .ToListAsync();

            foreach (var sc in shareCatalogs)
            {
                if (BCrypt.Net.BCrypt.Verify(password, sc.PasswordHash))
                    return sc;
            }

            return null;
        }

        public async Task<bool> DeleteAsync(string hash, int ownerId)
        {
            var shareCatalog = await _context.ShareCatalogs
                .FirstOrDefaultAsync(sc => sc.ShareHash == hash && sc.OwnerId == ownerId);

            if (shareCatalog == null)
                return false;

            _context.ShareCatalogs.Remove(shareCatalog);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<ShareCatalog>> GetByOwnerIdAsync(int ownerId)
        {
            return await _context.ShareCatalogs
                .Where(sc => sc.OwnerId == ownerId)
                .OrderByDescending(sc => sc.CreatedAt)
                .ToListAsync();
        }
    }
}
