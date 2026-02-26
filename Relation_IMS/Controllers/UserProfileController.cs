using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Datas.Interfaces;
using Relation_IMS.Dtos.UserProfileDtos;

namespace Relation_IMS.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileRepository _repo;

        public UserProfileController(IUserProfileRepository repo)
        {
            _repo = repo;
        }

        // GET api/v1/userprofile/{userId}
        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetUserProfile(int userId)
        {
            var profile = await _repo.GetUserProfileAsync(userId);
            if (profile == null)
                return NotFound(new { message = "User not found." });

            return Ok(profile);
        }

        // PUT api/v1/userprofile/{userId}
        [HttpPut("{userId:int}")]
        public async Task<IActionResult> UpdateUserProfile(int userId, UpdateUserProfileDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _repo.UpdateUserProfileAsync(userId, dto);
            if (result == null)
                return NotFound(new { message = "User not found." });

            return Ok(result);
        }

        // GET api/v1/userprofile/{userId}/salary
        [HttpGet("{userId:int}/salary")]
        public async Task<IActionResult> GetSalaryRecords(int userId)
        {
            var records = await _repo.GetSalaryRecordsAsync(userId);
            return Ok(records);
        }

        // POST api/v1/userprofile/{userId}/salary
        [HttpPost("{userId:int}/salary")]
        public async Task<IActionResult> AddSalaryRecord(int userId, CreateSalaryRecordDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _repo.AddSalaryRecordAsync(userId, dto);
            if (result == null)
                return NotFound(new { message = "User not found." });

            return Ok(result);
        }

        // DELETE api/v1/userprofile/salary/{id}
        [HttpDelete("salary/{id:int}")]
        public async Task<IActionResult> DeleteSalaryRecord(int id)
        {
            var success = await _repo.DeleteSalaryRecordAsync(id);
            if (!success)
                return NotFound(new { message = "Salary record not found." });

            return Ok(new { message = "Salary record deleted successfully." });
        }

        // PUT api/v1/userprofile/{userId}/change-password
        [HttpPut("{userId:int}/change-password")]
        public async Task<IActionResult> ChangePassword(int userId, ChangePasswordDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message) = await _repo.ChangePasswordAsync(userId, dto);
            if (!success)
                return BadRequest(new { message });

            return Ok(new { message });
        }
    }
}
