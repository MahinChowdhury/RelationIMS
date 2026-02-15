using System.Collections.Concurrent;

namespace Relation_IMS.Services
{
    public interface IConcurrencyLockService
    {
        Task<IDisposable> AcquireLockAsync(string key, TimeSpan? timeout = null);
    }

    public class ConcurrencyLockService : IConcurrencyLockService
    {
        private readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

        public async Task<IDisposable> AcquireLockAsync(string key, TimeSpan? timeout = null)
        {
            var semaphore = _locks.GetOrAdd(key, _ => new SemaphoreSlim(1, 1));

            var waitTime = timeout ?? TimeSpan.FromSeconds(30);
            
            if (!await semaphore.WaitAsync(waitTime))
            {
                throw new TimeoutException($"Could not acquire lock for key: {key} within {waitTime.TotalSeconds} seconds.");
            }

            return new LockReleaser(semaphore);
        }

        private class LockReleaser : IDisposable
        {
            private readonly SemaphoreSlim _semaphore;
            private bool _disposed;

            public LockReleaser(SemaphoreSlim semaphore)
            {
                _semaphore = semaphore;
            }

            public void Dispose()
            {
                if (_disposed) return;
                _semaphore.Release();
                _disposed = true;
            }
        }
    }
}
