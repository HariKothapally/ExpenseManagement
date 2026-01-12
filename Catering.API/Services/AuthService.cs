using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Identity;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly JwtSettings _jwtSettings;
    private readonly PasswordHasher<User> _passwordHasher;
    private static readonly HashSet<string> _validRoles = new HashSet<string> { "Admin", "User" };

    public AuthService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _passwordHasher = new PasswordHasher<User>();

        var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>();
        if (jwtSettings == null)
        {
            throw new InvalidOperationException("JWT configuration is missing in appsettings.json.");
        }
        if (string.IsNullOrEmpty(jwtSettings.Key) || string.IsNullOrEmpty(jwtSettings.Issuer) || string.IsNullOrEmpty(jwtSettings.Audience))
        {
            throw new InvalidOperationException("JWT configuration (Key, Issuer, or Audience) is missing in appsettings.json.");
        }

        _jwtSettings = jwtSettings;
    }

    public async Task<string?> AuthenticateAsync(string username, string password)
    {
        var normalizedUsername = username.ToLower();
        var user = await _userRepository.GetUserByUsernameAsync(normalizedUsername);
        if (user == null)
        {
            return null;
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
        if (verificationResult != PasswordVerificationResult.Success)
        {
            return null;
        }

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.ASCII.GetBytes(_jwtSettings.Key);
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            }),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.TokenExpirationInMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = _jwtSettings.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public async Task<bool> RegisterAsync(string username, string password, string role)
    {
        var normalizedUsername = username.ToLower();
        var existingUser = await _userRepository.GetUserByUsernameAsync(normalizedUsername);
        if (existingUser != null)
        {
            return false;
        }

        if (!_validRoles.Contains(role))
        {
            throw new ArgumentException($"Invalid role: {role}. Role must be one of: {string.Join(", ", _validRoles)}.");
        }

        var user = new User
        {
            Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
            Username = normalizedUsername,
            
            Role = role
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, password);
        await _userRepository.CreateUserAsync(user);
        return true;
    }
}