using Minio;
using Minio.DataModel.Args;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System.Text.RegularExpressions;

namespace Relation_IMS.Services.MinIOServices
{
    public class MinioBlobService : IMinioBlobService
    {
        private readonly IMinioClient _minioClient;
        private readonly string _bucketName;
        private readonly string _publicBaseUrl;
        private readonly SemaphoreSlim _initLock = new(1, 1);
        private bool _bucketInitialized;

        public MinioBlobService(IConfiguration configuration)
        {
            var minioConfig = configuration.GetSection("MinIO");
            var endpoint = minioConfig["Endpoint"] ?? "localhost:9000";
            var accessKey = minioConfig["AccessKey"] ?? "minioadmin";
            var secretKey = minioConfig["SecretKey"] ?? "minioadmin";
            var useSSL = bool.TryParse(minioConfig["UseSSL"], out var ssl) && ssl;
            _bucketName = minioConfig["BucketName"] ?? "product-images";
            _publicBaseUrl = minioConfig["PublicBaseUrl"] ?? $"http://{endpoint}";

            _minioClient = new MinioClient()
                .WithEndpoint(endpoint)
                .WithCredentials(accessKey, secretKey)
                .WithSSL(useSSL)
                .Build();
        }

        private async Task EnsureBucketInitializedAsync()
        {
            if (_bucketInitialized) return;

            await _initLock.WaitAsync();
            try
            {
                if (_bucketInitialized) return;

                var found = await _minioClient.BucketExistsAsync(new BucketExistsArgs().WithBucket(_bucketName));
                if (!found)
                {
                    await _minioClient.MakeBucketAsync(new MakeBucketArgs().WithBucket(_bucketName));
                }
                _bucketInitialized = true;
            }
            finally
            {
                _initLock.Release();
            }
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            await EnsureBucketInitializedAsync();

            var baseName = Path.GetFileNameWithoutExtension(file.FileName);
            var safeFileName = CleanFileName(baseName) + ".webp";

            using var inputStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream);
            using var outputStream = new MemoryStream();

            var encoder = new WebpEncoder { Quality = 70 };
            await image.SaveAsync(outputStream, encoder);

            outputStream.Position = 0;

            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(safeFileName)
                .WithStreamData(outputStream)
                .WithObjectSize(outputStream.Length)
                .WithContentType("image/webp"));

            return $"{_publicBaseUrl}/{_bucketName}/{safeFileName}";
        }

        public async Task<string> UploadImageStreamAsync(Stream stream, string fileName)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("Stream is empty");

            await EnsureBucketInitializedAsync();

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var safeFileName = CleanFileName(baseName) + ".webp";

            using var image = await Image.LoadAsync(stream);
            using var outputStream = new MemoryStream();

            var encoder = new WebpEncoder { Quality = 70 };
            await image.SaveAsync(outputStream, encoder);

            outputStream.Position = 0;

            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(safeFileName)
                .WithStreamData(outputStream)
                .WithObjectSize(outputStream.Length)
                .WithContentType("image/webp"));

            return $"{_publicBaseUrl}/{_bucketName}/{safeFileName}";
        }

        public async Task<(string FullUrl, string ThumbnailUrl)> UploadFileWithThumbnailAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            await EnsureBucketInitializedAsync();

            var baseName = Path.GetFileNameWithoutExtension(file.FileName);
            var safeFileName = CleanFileName(baseName) + ".webp";
            var thumbFileName = CleanFileName(baseName) + "_thumb.webp";

            using var inputStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream);

            var fullUrl = await UploadImageToMinioAsync(image, safeFileName, 70);
            var thumbUrl = await GenerateAndUploadThumbnailAsync(image, thumbFileName);

            return (fullUrl, thumbUrl);
        }

        public async Task<(string FullUrl, string ThumbnailUrl)> UploadImageStreamWithThumbnailAsync(Stream stream, string fileName)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("Stream is empty");

            await EnsureBucketInitializedAsync();

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var safeFileName = CleanFileName(baseName) + ".webp";
            var thumbFileName = CleanFileName(baseName) + "_thumb.webp";

            using var image = await Image.LoadAsync(stream);

            var fullUrl = await UploadImageToMinioAsync(image, safeFileName, 60);
            var thumbUrl = await GenerateAndUploadThumbnailAsync(image, thumbFileName);

            return (fullUrl, thumbUrl);
        }

        public async Task<(string FullUrl, string ThumbnailUrl, string ThumbnailUrlLarge)> UploadImageStreamWithThumbnailsAsync(Stream stream, string fileName)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("Stream is empty");

            await EnsureBucketInitializedAsync();

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var safeFileName = CleanFileName(baseName) + ".webp";
            var thumbFileName = CleanFileName(baseName) + "_thumb.webp";
            var thumbLargeFileName = CleanFileName(baseName) + "_thumb_large.webp";

            using var image = await Image.LoadAsync(stream);

            var fullUrl = await UploadImageToMinioAsync(image, safeFileName, 60);
            var thumbUrl = await GenerateAndUploadThumbnailAsync(image, thumbFileName);
            var thumbUrlLarge = await GenerateAndUploadLargeThumbnailAsync(image, thumbLargeFileName);

            return (fullUrl, thumbUrl, thumbUrlLarge);
        }

        private async Task<string> UploadImageToMinioAsync(Image image, string fileName, int quality)
        {
            using var outputStream = new MemoryStream();
            var encoder = new WebpEncoder { Quality = quality };
            await image.SaveAsync(outputStream, encoder);

            outputStream.Position = 0;

            await _minioClient.PutObjectAsync(new PutObjectArgs()
                .WithBucket(_bucketName)
                .WithObject(fileName)
                .WithStreamData(outputStream)
                .WithObjectSize(outputStream.Length)
                .WithContentType("image/webp"));

            return $"{_publicBaseUrl}/{_bucketName}/{fileName}";
        }

        private async Task<string> GenerateAndUploadThumbnailAsync(Image image, string thumbFileName)
        {
            const int maxWidth = 480;
            int newWidth = image.Width;
            int newHeight = image.Height;

            if (image.Width > maxWidth)
            {
                newWidth = maxWidth;
                newHeight = (int)((decimal)image.Height * maxWidth / image.Width);
            }

            using var thumbnail = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(newWidth, newHeight),
                Mode = ResizeMode.Max
            }));

            return await UploadImageToMinioAsync(thumbnail, thumbFileName, 75);
        }

        private async Task<string> GenerateAndUploadLargeThumbnailAsync(Image image, string thumbFileName)
        {
            const int maxWidth = 560;
            int newWidth = image.Width;
            int newHeight = image.Height;

            if (image.Width > maxWidth)
            {
                newWidth = maxWidth;
                newHeight = (int)((decimal)image.Height * maxWidth / image.Width);
            }

            using var thumbnail = image.Clone(ctx => ctx.Resize(new ResizeOptions
            {
                Size = new Size(newWidth, newHeight),
                Mode = ResizeMode.Max
            }));

            return await UploadImageToMinioAsync(thumbnail, thumbFileName, 80);
        }

        private static string CleanFileName(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return "image-" + DateTime.UtcNow.Ticks;

            var cleaned = Regex.Replace(input, @"\s+", "");
            cleaned = Regex.Replace(cleaned, @"[^a-zA-Z0-9\-_]", "");
            cleaned = cleaned.ToLowerInvariant();

            return string.IsNullOrEmpty(cleaned) ? "unnamed" : cleaned;
        }
    }
}
