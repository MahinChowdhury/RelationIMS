using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Dtos.JWTDtos;
using Relation_IMS.Services.JWTServices;
using System.Security.Claims;

namespace Relation_IMS.Controllers.JWTControllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        // GET api/v1/user
        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] string? role, [FromQuery] bool? isActive)
        {
            var users = await _userService.GetAllUsersAsync(role, isActive);

            if (!User.IsInRole("Owner"))
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(userIdClaim, out var currentUserId))
                {
                    users = users.Where(u => u.Id == currentUserId).ToList();
                }
                else
                {
                    users = new List<UserListDTO>();
                }
            }

            return Ok(users);
        }

        // GET api/v1/user/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            var users = await _userService.GetAllUsersAsync();
            var user = users.FirstOrDefault(u => u.Id == id);
            if (user == null)
                return NotFound(new { message = "User not found." });
            return Ok(user);
        }

        // POST api/v1/user
        [HttpPost]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> CreateUser(AdminCreateUserDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.AdminCreateUserAsync(dto);
            if (result == null)
                return BadRequest(new { message = "Email already exists." });

            return Ok(result);
        }

        // PUT api/v1/user/{id}
        [HttpPut("{id}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> UpdateUser(int id, UserUpdateDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _userService.UpdateUserAsync(id, dto);
            if (result == null)
                return NotFound(new { message = "User not found or email conflict." });

            return Ok(result);
        }

        // DELETE api/v1/user/{id}
        [HttpDelete("{id}")]
        [Authorize(Roles = "Owner")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _userService.DeleteUserAsync(id);
            if (!success)
                return NotFound(new { message = "User not found." });

            return Ok(new { message = "User deactivated successfully." });
        }

        // GET api/v1/user/roles
        [HttpGet("roles")]
        public async Task<IActionResult> GetAllRoles()
        {
            var roles = await _userService.GetAllRolesAsync();
            return Ok(roles);
        }
    }
}
