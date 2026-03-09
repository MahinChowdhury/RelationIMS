using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Services.MinIOServices;

namespace Relation_IMS.Controllers.AzureControllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class BlobController : ControllerBase
    {
        private readonly IMinioBlobService _blobService;
        public BlobController(IMinioBlobService blobService)
        {
            _blobService = blobService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadFileAsync(IFormFile file)
        {
            var url = await _blobService.UploadFileAsync(file);
            return Ok(url);
        }
    }
}
