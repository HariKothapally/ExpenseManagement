# Stage 1: Build the application
# IMPORTANT: Replace '8.0' with your actual .NET version (e.g., 6.0, 7.0, 9.0) from your .csproj!
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy only the project file first to leverage Docker layer caching for dependencies
COPY ["Catering.API/Catering.API.csproj", "Catering.API/"]
# If Catering.API references other projects, copy their .csproj files here too

# Restore dependencies for the API project
RUN dotnet restore "Catering.API/Catering.API.csproj"

# Copy the entire source code (API and ReactApp) into the build stage
# Assumes the build context is the parent directory containing both folders.
COPY . .

# Set the working directory to the API project folder
WORKDIR "/src/Catering.API"

# Publish the application in Release configuration
# The <Content Include...> in your .csproj ensures the ReactApp files (excluding node_modules)
# are included in the publish output directory (/app/publish).
# '/p:UseAppHost=false' is often recommended for containers.
RUN dotnet publish "Catering.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Create the final runtime image
# IMPORTANT: Replace '8.0' with your actual .NET version (must match the SDK version used above)!
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copy the published application artifacts from the build stage
COPY --from=build /app/publish .

# Expose port 8080. ASP.NET Core apps in containers often default to 8080 (or 80).
# Check your Program.cs or appsettings.json if you configure ports explicitly.
# The ASPNETCORE_URLS environment variable (set below or during 'docker run') controls this.
EXPOSE 8080

# Define the entry point for the container. This runs the application.
# Ensure 'Catering.API.dll' matches the actual output assembly name.
ENTRYPOINT ["dotnet", "Catering.API.dll"]

# Recommended: Set environment variables for container runtime behavior
# Ensures the app listens on the correct port inside the container.
ENV ASPNETCORE_URLS=http://+:8080
# Sets the environment (e.g., Production, Staging, Development)
# ENV ASPNETCORE_ENVIRONMENT=Production
