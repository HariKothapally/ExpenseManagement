using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authorization;
using System.Text;

public static class AuthenticationExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        // Load JWT settings from configuration
        var jwtSettings = configuration.GetSection("Jwt").Get<JwtSettings>();
        if (jwtSettings == null || string.IsNullOrEmpty(jwtSettings.Key) || string.IsNullOrEmpty(jwtSettings.Issuer) || string.IsNullOrEmpty(jwtSettings.Audience))
        {
            throw new InvalidOperationException("JWT configuration (Key, Issuer, or Audience) is missing in appsettings.json.");
        }

        // Validate key length for HMAC-SHA256 (minimum 32 characters)
        if (jwtSettings.Key.Length < 32)
        {
            throw new InvalidOperationException("JWT Key must be at least 32 characters long for HMAC-SHA256.");
        }

        // Fallback to environment variable for the key (optional, for production)
        var jwtKey = Environment.GetEnvironmentVariable("JWT_KEY") ?? jwtSettings.Key;

        // Configure JWT authentication
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidAudience = jwtSettings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(jwtKey)),
                ClockSkew = TimeSpan.FromMinutes(5) // Allow 5-minute clock skew
            };

            // Customize authentication failure responses
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    if (context.Exception.GetType() == typeof(SecurityTokenExpiredException))
                    {
                        context.Response.Headers.Append("Token-Expired", "true");
                    }
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    context.Response.StatusCode = 401;
                    context.Response.ContentType = "application/json";
                    context.Response.WriteAsync("{\"error\":\"Unauthorized: Invalid or missing token.\"}");
                    context.HandleResponse(); // Skip default behavior
                    return Task.CompletedTask;
                }
            };
        });

        // Configure authorization policies
        services.AddAuthorization(options =>
        {
            // Policy for admin-only access
            options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));

            // Default policy: require authenticated user for all endpoints unless [AllowAnonymous]
            options.DefaultPolicy = new AuthorizationPolicyBuilder()
                .RequireAuthenticatedUser()
                .Build();
        });

        return services;
    }
}