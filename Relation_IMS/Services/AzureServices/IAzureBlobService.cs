namespace Relation_IMS.Services.AzureServices
{
    public interface IAzureBlobService
    {
        Task<string> UploadFileAsync(IFormFile file);
        Task<string> UploadImageStreamAsync(Stream stream, string fileName);
    }
}
