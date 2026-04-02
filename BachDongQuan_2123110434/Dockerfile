# ──────────────────────────────────────────
# Stage 1: Build (chạy trên Render, có internet)
# ──────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy .csproj và restore packages (Render có internet → tải được Npgsql)
COPY ["BachDongQuan_2123110434/BachDongQuan_2123110434.csproj", "BachDongQuan_2123110434/"]
RUN dotnet restore "BachDongQuan_2123110434/BachDongQuan_2123110434.csproj"

# Copy toàn bộ code và build
COPY . .
WORKDIR "/src/BachDongQuan_2123110434"
RUN dotnet publish "BachDongQuan_2123110434.csproj" -c Release -o /app/publish /p:UseAppHost=false

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

ENTRYPOINT ["dotnet", "BachDongQuan_2123110434.dll"]
