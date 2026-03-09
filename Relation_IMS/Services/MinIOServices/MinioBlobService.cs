using Minio;
using Minio.DataModel.Args;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
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

            var encoder = new WebpEncoder { Quality = 60 };
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
