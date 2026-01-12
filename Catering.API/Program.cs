var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Register application services
builder.Services.AddApplicationServices();

// Configure JWT authentication and authorization
builder.Services.AddJwtAuthentication(builder.Configuration);

// Configure Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGenWithAuth();

var app = builder.Build();

// Configure the HTTP request pipeline
app.UseApplicationMiddleware(app.Environment);

app.Run();