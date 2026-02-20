namespace Relation_IMS.Services
{
    public interface IRedisCacheService
    {
        Task<string?> GetCachedResponseAsync(string cacheKey);
        Task SetCacheResponseAsync(string cacheKey, string response, TimeSpan ttl);
        Task InvalidateCacheByPrefixAsync(string prefix);
    }
}
