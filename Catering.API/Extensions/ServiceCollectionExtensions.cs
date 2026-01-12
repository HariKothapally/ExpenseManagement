public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {   
        // Add CORS policy
        services.AddCors(options =>
        {
            options.AddPolicy("AllowFrontend", policy =>
            {
                policy.WithOrigins("http://localhost:5173", "https://hrimsf.netlify.app", "http://localhost:5500", "http://127.0.0.1:5500")
                      .AllowAnyHeader()
                      .AllowAnyMethod();
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
