using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;
using System.Text.RegularExpressions;

namespace Relation_IMS.Services.AzureServices
{
    public class AzureBlobService : IAzureBlobService
    {
        private readonly BlobContainerClient _blobClient;

        public AzureBlobService(BlobServiceClient blobServiceClient)
        {
            var containerName = "product-images";
            _blobClient = blobServiceClient.GetBlobContainerClient(containerName);
            _blobClient.CreateIfNotExists(PublicAccessType.Blob);
        }

        public async Task<string> UploadFileAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            var baseName = Path.GetFileNameWithoutExtension(file.FileName);
            var safeFileName = CleanFileName(baseName) + ".webp";

            var blobClient = _blobClient.GetBlobClient(safeFileName);

            using var inputStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream);
            using var outputStream = new MemoryStream();

            var encoder = new WebpEncoder { Quality = 50 };
            await image.SaveAsync(outputStream, encoder);

            outputStream.Position = 0;
            await blobClient.UploadAsync(outputStream, overwrite: true);

            return blobClient.Uri.ToString();
        }

        public async Task<string> UploadImageStreamAsync(Stream stream, string fileName)
        {
            if (stream == null || stream.Length == 0)
                throw new ArgumentException("Stream is empty");

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            var safeFileName = CleanFileName(baseName) + ".webp";

            var blobClient = _blobClient.GetBlobClient(safeFileName);

            using var image = await Image.LoadAsync(stream);
            using var outputStream = new MemoryStream();

            var encoder = new WebpEncoder { Quality = 50 };
            await image.SaveAsync(outputStream, encoder);

            outputStream.Position = 0;
            await blobClient.UploadAsync(outputStream, overwrite: true);

            return blobClient.Uri.ToString();
        }

        private static string CleanFileName(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return "image-" + DateTime.UtcNow.Ticks;

            // Remove ALL whitespaces
            var cleaned = Regex.Replace(input, @"\s+", "");

            // Remove invalid characters
            cleaned = Regex.Replace(cleaned, @"[^a-zA-Z0-9\-_]", "");

            // Lowercase for consistency
            cleaned = cleaned.ToLowerInvariant();

            return string.IsNullOrEmpty(cleaned) ? "unnamed" : cleaned;
        }

    }
}
