using Microsoft.IdentityModel.Tokens;
using Relation_IMS.Models;
using Relation_IMS.Models.JWTModels;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Relation_IMS.Services.JWTServices
{
    public class TokenService : ITokenService
    {
        // IConfiguration to access appsettings.json values like issuer and token expiry times
        private readonly IConfiguration _configuration;
        // Constructor injects IConfiguration dependency
        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }
        // Generates a JWT Access Token for the authenticated user.
        public string GenerateAccessToken(User user, IList<string> roles, out string jwtId, Client client)
        {
            // Initialize JWT token handler which creates and serializes tokens
            var tokenHandler = new JwtSecurityTokenHandler();
            // Decode the Base64-encoded client secret key into byte array for signing
            var keyBytes = Convert.FromBase64String(client.ClientSecret);
            var key = new SymmetricSecurityKey(keyBytes);
            // Generate a new unique identifier for the JWT token (jti claim)
            jwtId = Guid.NewGuid().ToString();
            // Read issuer and token expiration from configuration, with default fallback values
            var issuer = _configuration["JwtSettings:Issuer"] ?? "DefaultIssuer";
            var accessTokenExpirationMinutes = int.TryParse(_configuration["JwtSettings:AccessTokenExpirationMinutes"], out var val) ? val : 15;
            // Define the claims to be embedded in the JWT token
            var claims = new List<Claim>
            {
                // Subject claim represents user identifier
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                // JWT ID claim for unique token identification (used to link refresh tokens)
                new Claim(JwtRegisteredClaimNames.Jti, jwtId),
                // User email claim for identification purposes
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                // Issuer claim indicating the token issuer
                new Claim(JwtRegisteredClaimNames.Iss, issuer),
                // Audience claim specifying the client URL expected to receive the token
                new Claim(JwtRegisteredClaimNames.Aud, client.ClientURL),
                // Custom claim specifying the client id (helps identify which client requested the token)
                new Claim("client_id", client.ClientId)
            };

            if (user.ShopNo.HasValue)
            {
                claims.Add(new Claim("ShopNo", user.ShopNo.Value.ToString()));
            }
            // Add role claims for authorization and role-based access control
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
            // Create signing credentials with the symmetric security key and HMAC SHA256 algorithm
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);
            // Define the JWT token descriptor containing claims, expiration, signing credentials, issuer, and audience
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims), // Claims identity constructed from claims list
                Expires = DateTime.UtcNow.AddMinutes(accessTokenExpirationMinutes), // Token expiration time
                SigningCredentials = creds, // Signing credentials using client secret key
                Issuer = issuer, // Token issuer
                Audience = client.ClientURL // Token audience (client URL)
            };
            // Create the JWT token based on the descriptor
            var token = tokenHandler.CreateToken(tokenDescriptor);
            // Serialize the JWT token to compact JWT format string
            return tokenHandler.WriteToken(token);
        }
        // Generates a Refresh Token linked to a JWT token and client.
        public RefreshToken GenerateRefreshToken(string ipAddress, string jwtId, Client client, int userId)
        {
            // Generate a secure random 64-byte array to be used as the refresh token string
            var randomBytes = new byte[64];
            using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(randomBytes);
            // Read refresh token expiration duration from config, default to 7 days if not set
            var refreshTokenExpirationDays = int.TryParse(_configuration["JwtSettings:RefreshTokenExpirationDays"], out var val) ? val : 7;
            // Create and return the RefreshToken entity with all required properties set
            return new RefreshToken
            {
                // Refresh token string encoded as Base64 for safe storage and transmission
                Token = Convert.ToBase64String(randomBytes),
                // Link to the JWT ID so that refresh token can be invalidated if corresponding JWT is revoked
                JwtId = jwtId,
                // Set expiration date for refresh token
                Expires = DateTime.UtcNow.AddDays(refreshTokenExpirationDays),
                // Timestamp when refresh token was created
                CreatedAt = DateTime.UtcNow,
                // Associate refresh token with the user ID
                UserId = userId,
                // Associate refresh token with the client ID
                ClientId = client.Id,
                // Initially mark the token as active (not revoked)
                IsRevoked = false,
                // No revocation date since token is active
                RevokedAt = null,
                // Store IP address from which the refresh token was created (useful for audits)
                CreatedByIp = ipAddress
            };
        }
    }
}
