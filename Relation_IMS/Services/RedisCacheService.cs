using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;
using System.Threading;

namespace Relation_IMS.Services
{
    public class RedisCacheService : IRedisCacheService
    {
        private readonly IDistributedCache _cache;
        private readonly IConnectionMultiplexer _redis;
        private const int DefaultTimeoutMs = 3000;

        // Must match the InstanceName set in AddStackExchangeRedisCache in Program.cs
        private const string InstanceName = "RelationIMS:";

        public RedisCacheService(IDistributedCache cache, IConnectionMultiplexer redis)
        {
            _cache = cache;
            _redis = redis;
        }

        public async Task<string?> GetCachedResponseAsync(string cacheKey)
        {
            try
            {
                using var cts = new CancellationTokenSource(DefaultTimeoutMs);
                return await _cache.GetStringAsync(cacheKey, cts.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[Redis] GetAsync timed out for key: {cacheKey}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Redis] GetAsync failed: {ex.Message}");
                return null;
            }
        }

        public async Task SetCacheResponseAsync(string cacheKey, string response, TimeSpan ttl)
        {
            try
            {
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = ttl
                };
                using var cts = new CancellationTokenSource(DefaultTimeoutMs);
                await _cache.SetStringAsync(cacheKey, response, options, cts.Token);
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[Redis] SetAsync timed out for key: {cacheKey}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Redis] SetAsync failed: {ex.Message}");
            }
        }

        public async Task InvalidateCacheByPrefixAsync(string prefix)
        {
            try
            {
                Console.WriteLine($"[Redis] InvalidateCacheByPrefixAsync called with prefix: {prefix}");
                
                var server = _redis.GetServer(_redis.GetEndPoints().First());

                // IDistributedCache prepends the InstanceName ("RelationIMS:") to all keys.
                // We must include it when scanning, otherwise we'd never match any keys.
                var pattern = $"{InstanceName}{prefix}:*";
                Console.WriteLine($"[Redis] Searching keys with pattern: {pattern}");
                
                using var cts = new CancellationTokenSource(10000); // 10 second timeout for keys scan
                var keys = await Task.Run(() => server.Keys(pattern: pattern).ToArray(), cts.Token);
                Console.WriteLine($"[Redis] Found {keys.Length} keys to delete for prefix '{prefix}'");

                if (keys.Length > 0)
                {
                    var db = _redis.GetDatabase();
                    await db.KeyDeleteAsync(keys);
                    Console.WriteLine($"[Redis] Deleted {keys.Length} keys");
                }
            }
            catch (OperationCanceledException)
            {
                Console.WriteLine($"[Redis] InvalidateCacheByPrefixAsync timed out for prefix: {prefix}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Redis] InvalidateCacheByPrefixAsync failed: {ex.Message}");
            }
        }
    }
}
