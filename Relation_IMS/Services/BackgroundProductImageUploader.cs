using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Services.MinIOServices;
using System.Threading.Channels;

namespace Relation_IMS.Services
{
    public record ProductImageUploadTask(int ProductId, List<(string FileName, Stream Content)> Images);

    public class BackgroundProductImageUploader : BackgroundService
    {
        private readonly Channel<ProductImageUploadTask> _channel;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<BackgroundProductImageUploader> _logger;
        private readonly int _maxDegreeOfParallelism;

        public BackgroundProductImageUploader(
            Channel<ProductImageUploadTask> channel,
            IServiceScopeFactory scopeFactory,
            ILogger<BackgroundProductImageUploader> logger,
            IConfiguration configuration)
        {
            _channel = channel;
            _scopeFactory = scopeFactory;
            _logger = logger;
            _maxDegreeOfParallelism = configuration.GetValue("ImageUpload:MaxDegreeOfParallelism", 4);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            await foreach (var task in _channel.Reader.ReadAllAsync(stoppingToken))
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);

                try
                {
                    _logger.LogInformation("Starting background image upload for Product ID {ProductId} with {Count} images.", task.ProductId, task.Images.Count);

                    using var scope = _scopeFactory.CreateScope();
                    var blobService = scope.ServiceProvider.GetRequiredService<IMinioBlobService>();
                    var productRepo = scope.ServiceProvider.GetRequiredService<IProductRepository>();

                    var uploadedUrls = new List<string>();
                    var semaphore = new SemaphoreSlim(_maxDegreeOfParallelism);
                    var uploadTasks = task.Images.Select(async image =>
                    {
                        await semaphore.WaitAsync(cts.Token);
                        try
                        {
                            var (url, thumbUrl, thumbUrlLarge) = await blobService.UploadImageStreamWithThumbnailsAsync(image.Content, image.FileName);
                            return (url, thumbUrl, thumbUrlLarge);
                        }
                        finally
                        {
                            semaphore.Release();
                            await image.Content.DisposeAsync();
                        }
                    });

                    try
                    {
                        var results = await Task.WhenAll(uploadTasks);
                        uploadedUrls.AddRange(results.Where(r => !string.IsNullOrEmpty(r.url)).Select(r => r.url));
                    }
                    catch (OperationCanceledException)
                    {
                        _logger.LogWarning("Image upload cancelled for product {ProductId}", task.ProductId);
                        throw;
                    }

                    if (uploadedUrls.Any())
                    {
                        var product = await productRepo.GetProductByIdAsync(task.ProductId);
                        if (product != null)
                        {
                            var currentImages = product.ImageUrls ?? new List<string>();
                            currentImages.AddRange(uploadedUrls);
                            
                            var firstImageUrl = uploadedUrls.FirstOrDefault();
                            var thumbnailUrl = !string.IsNullOrEmpty(firstImageUrl) 
                                ? firstImageUrl.Replace(".webp", "_thumb.webp") 
                                : null;
                            var thumbnailUrlLarge = !string.IsNullOrEmpty(firstImageUrl) 
                                ? firstImageUrl.Replace(".webp", "_thumb_large.webp") 
                                : null;
                            
                            var updateDto = new Relation_IMS.Dtos.ProductDtos.UpdateProductDTO
                            {
                                Name = product.Name,
                                Description = product.Description,
                                BasePrice = product.BasePrice,
                                CategoryId = product.CategoryId,
                                BrandId = product.BrandId,
                                QuarterIds = product.Quarters?.Select(q => q.Id).ToList() ?? new List<int>(),
                                ImageUrls = currentImages,
                                ThumbnailUrl = thumbnailUrl,
                                ThumbnailUrlLarge = thumbnailUrlLarge,
                                Variants = null
                            };
                            
                            await productRepo.UpdateProductByIdAsync(product.Id, updateDto);
                             _logger.LogInformation("Updated Product ID {ProductId} with {Count} new images and thumbnail.", task.ProductId, uploadedUrls.Count);

                            var redisCacheService = scope.ServiceProvider.GetService<IRedisCacheService>();
                            if (redisCacheService != null)
                            {
                                await redisCacheService.InvalidateCacheByPrefixAsync("product");
                                _logger.LogInformation("Invalidated 'product' cache prefix for Product ID {ProductId}.", task.ProductId);
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing background upload for product {ProductId}", task.ProductId);
                }
            }
        }
    }
}
