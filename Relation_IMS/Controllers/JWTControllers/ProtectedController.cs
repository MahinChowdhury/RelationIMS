using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Relation_IMS.Models;
using System.Security.Claims;

namespace Relation_IMS.Controllers.JWTControllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Requires the caller to be authenticated with a valid JWT token for all actions
    public class ProtectedController : ControllerBase
    {
        // GET api/protected/userdata
        // Accessible by any authenticated user
        [HttpGet("userdata")]
        public IActionResult GetUserData()
        {
            // Extract the user's email from JWT claims; if missing, default to "unknown"
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "unknown";
            // Extract the user's ID from JWT claims (typically stored in NameIdentifier); default to "unknown"
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "unknown";
            // Return a friendly message including user's email and ID
            return Ok(new { message = $"Hello, {userEmail}! Your User ID is {userId}." });
        }
        // GET api/protected/adminonly
        // This endpoint requires the user to have the "Admin" role claim
        [HttpGet("adminonly")]
        [Authorize(Roles = "Admin")] // Restricts access to users who have the "Admin" role claim
        public IActionResult AdminOnly()
        {
            // Return a success message for authorized admin users
            return Ok(new { message = "Welcome, Admin! You have access to this resource." });
        }
    }
}
