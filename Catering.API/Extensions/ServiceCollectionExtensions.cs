using Catering.API.Configurations;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure CORS from appsettings
        var corsSettings = configuration.GetSection("Cors").Get<CorsSettings>();

        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                if (corsSettings?.AllowedOrigins != null && corsSettings.AllowedOrigins.Length > 0)
                {
                    policy.WithOrigins(corsSettings.AllowedOrigins)
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                }
                else
                {
                    // Fallback to allowing all if not configured
                    policy.AllowAnyOrigin()
                          .AllowAnyHeader()
                          .AllowAnyMethod();
                }
            });
        });

        // Register MongoDbContext
        services.AddSingleton<MongoDbContext>();
        // Register GeminiBillExtractor
        services.AddScoped<IGeminiBillExtractor, GeminiBillExtractor>();

        // Register repositories
        services.AddScoped<IBillRepository, BillRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Register services
        services.AddScoped<IAuthService, AuthService>();

        // Register HttpClient for BillsController
        services.AddHttpClient<BillsController>();

        return services;
    }
}
