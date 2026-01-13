using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Processing;
using SixLabors.ImageSharp.Formats.Webp;
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

            // Clean and normalize filename
            var fileNameWithoutExt = Path.GetFileNameWithoutExtension(file.FileName);
            var safeFileName = CleanFileName(fileNameWithoutExt) + ".webp";

            var blobClient = _blobClient.GetBlobClient(safeFileName);

            // Load and convert image to WebP
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
            // Clean the provided filename (remove extension if present, then sanitize)
            var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);
            var safeFileName = CleanFileName(fileNameWithoutExt) + ".webp";

            var blobClient = _blobClient.GetBlobClient(safeFileName);

            // Make sure stream is at beginning
            if (stream.Position != 0 && stream.CanSeek)
                stream.Position = 0;

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
                return "image-" + DateTime.UtcNow.Ticks; // fallback

            // Replace multiple whitespaces with single hyphen
            // Remove or replace other problematic characters
            var cleaned = Regex.Replace(input.Trim(), @"\s+", "-");
            cleaned = Regex.Replace(cleaned, @"[^a-zA-Z0-9\-_]", ""); 

            // Optional: lowercase (common convention for blob names)
            cleaned = cleaned.ToLowerInvariant();

            // Avoid empty result
            return string.IsNullOrEmpty(cleaned) ? "unnamed" : cleaned;
        }
    }
}