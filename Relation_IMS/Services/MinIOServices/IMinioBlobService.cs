namespace Relation_IMS.Services.MinIOServices
{
    public interface IMinioBlobService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<string> UploadImageStreamAsync(Stream stream, string fileName);
        Task<(string FullUrl, string ThumbnailUrl)> UploadFileWithThumbnailAsync(IFormFile file);
        Task<(string FullUrl, string ThumbnailUrl)> UploadImageStreamWithThumbnailAsync(Stream stream, string fileName);
        Task<(string FullUrl, string ThumbnailUrl, string ThumbnailUrlLarge)> UploadImageStreamWithThumbnailsAsync(Stream stream, string fileName);
    }
}
