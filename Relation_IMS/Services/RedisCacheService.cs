using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace Relation_IMS.Services
{
    public class RedisCacheService : IRedisCacheService
    {
        private readonly IDistributedCache _cache;
        private readonly IConnectionMultiplexer _redis;

        // Must match the InstanceName set in AddStackExchangeRedisCache in Program.cs
        private const string InstanceName = "RelationIMS:";

        public RedisCacheService(IDistributedCache cache, IConnectionMultiplexer redis)
        {
            _cache = cache;
            _redis = redis;
        }

        public async Task<string?> GetCachedResponseAsync(string cacheKey)
        {
            return await _cache.GetStringAsync(cacheKey);
        }

        public async Task SetCacheResponseAsync(string cacheKey, string response, TimeSpan ttl)
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = ttl
            };
            await _cache.SetStringAsync(cacheKey, response, options);
        }

        public async Task InvalidateCacheByPrefixAsync(string prefix)
        {
            var server = _redis.GetServer(_redis.GetEndPoints().First());

            // IDistributedCache prepends the InstanceName ("RelationIMS:") to all keys.
            // We must include it when scanning, otherwise we'd never match any keys.
            var keys = server.Keys(pattern: $"{InstanceName}{prefix}:*").ToArray();

            if (keys.Length > 0)
            {
                var db = _redis.GetDatabase();
                await db.KeyDeleteAsync(keys);
            }
        }
    }
}
