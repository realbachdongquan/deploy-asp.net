# 1. Base Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 2. Build Image
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["BachDongQuan_2123110434/BachDongQuan_2123110434.csproj", "BachDongQuan_2123110434/"]
RUN dotnet restore "./BachDongQuan_2123110434/BachDongQuan_2123110434.csproj"
COPY . .
WORKDIR "/src/BachDongQuan_2123110434"
RUN dotnet build "./BachDongQuan_2123110434.csproj" -c $BUILD_CONFIGURATION -o /app/build

# 3. Publish Image
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./BachDongQuan_2123110434.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# 4. Final Production Image
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
# Default ENV for Production
ENV ASPNETCORE_ENVIRONMENT=Production
ENTRYPOINT ["dotnet", "BachDongQuan_2123110434.dll"]
