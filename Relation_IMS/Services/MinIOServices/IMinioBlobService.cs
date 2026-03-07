namespace Relation_IMS.Services.MinIOServices
{
    public interface IMinioBlobService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<string> UploadImageStreamAsync(Stream stream, string fileName);
    }
}
