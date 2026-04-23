# ──────────────────────────────────────────
# Stage 1: Build (chạy trên Render, có internet)
# ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj và restore packages
COPY ["Cinema.Backend.csproj", "."]
RUN dotnet restore "Cinema.Backend.csproj"

# Copy toàn bộ code và build
COPY . .
RUN dotnet publish "Cinema.Backend.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ──────────────────────────────────────────
# Stage 2: Runtime (nhẹ hơn, chỉ chứa app)
# ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Copy artifact từ build stage
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

# Cấu hình để tránh lỗi inotify limit trên Render
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV ASPNETCORE_hostBuilder_reloadConfigOnChange=false

ENTRYPOINT ["dotnet", "Cinema.Backend.dll"]
