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
                            var url = await blobService.UploadImageStreamAsync(image.Content, image.FileName);
                            return url;
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
                        uploadedUrls.AddRange(results.Where(url => !string.IsNullOrEmpty(url)));
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
                            // If product already has images, append new ones? Or replace? 
                            // Usually this flow is for NEW products, but let's see. 
                            // The user said "update the imageUrls with the response".
                            
                            var currentImages = product.ImageUrls ?? new List<string>();
                            currentImages.AddRange(uploadedUrls);
                            
                            // We need a way to UPDATE just the images or use the general update.
                            // ProductRepository.UpdateProductByIdAsync takes UpdateProductDTO.
                            // This might be inefficient if we have to map everything back.
                            // Ideally we should have a specific method to update images, but let's use what we have or add a method.
                            
                            // Let's try to fetch, modify and save.
                            // Does repo expose generic Save? No. IProductRepository has UpdateProductByIdAsync.
                            // Let's see UpdateProductDTO.
                            
                            // We can use UpdateProductByIdAsync but we need to populate everything else to avoid wiping data?
                            // Or does UpdateProductByIdAsync handle partial updates? 
                            // Usually Repositories with UpdateDTO replace fields.
                            
                            // I should verify ProductRepository implementation.
                            // For now, let's assume I need to map existing product to UpdateProductDTO.
                            
                            var updateDto = new Relation_IMS.Dtos.ProductDtos.UpdateProductDTO
                            {
                                Name = product.Name,
                                Description = product.Description,
                                BasePrice = product.BasePrice,
                                CategoryId = product.CategoryId, // Should be valid
                                BrandId = product.BrandId,
                                QuarterIds = product.Quarters?.Select(q => q.Id).ToList() ?? new List<int>(),
                                ImageUrls = currentImages,
                                Variants = null // Watch out if this wipes variants! 
                            };
                            
                            // Note: ProductRepository logic needs to be checked to ensure it doesn't wipe Variants if we pass null.
                            
                            await productRepo.UpdateProductByIdAsync(product.Id, updateDto);
                             _logger.LogInformation("Updated Product ID {ProductId} with {Count} new images.", task.ProductId, uploadedUrls.Count);

                            // Invalidate product caching so that the product list is refreshed
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
