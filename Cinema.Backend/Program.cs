using Microsoft.EntityFrameworkCore;
using ConnectDB.Data;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using Hangfire;
using Hangfire.SqlServer;
using Hangfire.PostgreSql;
using Microsoft.AspNetCore.RateLimiting;

var builder = WebApplication.CreateBuilder(args);
// builder.Services.AddControllers();

// Sửa lỗi PostgreSQL DateTime Kind
AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);

// 1. Kết nối Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<AppDbContext>(options =>
{
    if (connectionString != null && (connectionString.Contains("Host=") || connectionString.Contains("Port=") || connectionString.Contains("SSL Mode=") || connectionString.Contains("postgres://")))
    {
        options.UseNpgsql(connectionString);
    }
    else
    {
        options.UseSqlServer(connectionString);
    }
});

// 2. Cấu hình CORS
builder.Services.AddCors(options => {
    options.AddPolicy("AllowReact", policy =>
        policy.WithOrigins(
            "http://localhost:3000",
            "http://localhost:5173",
            "https://www.bachdongquan.dev",
            "https://bachdongquan.dev",
            "https://deploy-asp-net.onrender.com",
            builder.Configuration["AllowedOrigins"] ?? "http://localhost:5173"
        )
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials());
});

// 2.5. Cấu hình JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? ""))
            // RoleClaimType = "role" // Use default mapping
        };
    });

builder.Services.AddControllers().AddJsonOptions(x =>
    x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Cinema API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[] { }
        }
    });
});
builder.Services.AddHttpContextAccessor();
builder.Services.AddSignalR();
builder.Services.AddMemoryCache();

// 3. Cấu hình Hangfire
builder.Services.AddHangfire(configuration => 
{
    configuration
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings();

    if (connectionString != null && (connectionString.Contains("Host=") || connectionString.Contains("Port=") || connectionString.Contains("postgres://")))
    {
        configuration.UsePostgreSqlStorage(options => options.UseNpgsqlConnection(connectionString));
    }
    else
    {
        configuration.UseSqlServerStorage(connectionString, new SqlServerStorageOptions
        {
            CommandBatchMaxTimeout = TimeSpan.FromMinutes(5),
            SlidingInvisibilityTimeout = TimeSpan.FromMinutes(5),
            QueuePollInterval = TimeSpan.Zero,
            UseRecommendedIsolationLevel = true,
            DisableGlobalLocks = true
        });
    }
});

// builder.Services.AddHangfireServer();

builder.Services.AddHttpClient<ConnectDB.Services.IAIService, ConnectDB.Services.AIService>();
builder.Services.AddScoped<ConnectDB.Services.IAuthService, ConnectDB.Services.AuthService>();
builder.Services.AddScoped<ConnectDB.Services.IBookingService, ConnectDB.Services.BookingService>();
builder.Services.AddScoped<ConnectDB.Services.IVnPayService, ConnectDB.Services.VnPayService>();
builder.Services.AddScoped<ConnectDB.Services.IAuditService, ConnectDB.Services.AuditService>();
builder.Services.AddScoped<ConnectDB.Services.IEmailService, ConnectDB.Services.EmailService>();
builder.Services.AddHostedService<ConnectDB.BackgroundServices.SeatLockCleanupService>();
builder.Services.AddHostedService<ConnectDB.BackgroundServices.ReviewSentimentWorker>();

builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.Window = TimeSpan.FromSeconds(10);
        opt.PermitLimit = 10;
        opt.QueueLimit = 0;
    });
});

var app = builder.Build();
app.UseRateLimiter();

// Auto-migrate Production DB
if (app.Environment.IsProduction())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedData.Initialize(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    SeedData.Initialize(context);
}

app.UseCors("AllowReact");

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseAuthentication();
app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<ConnectDB.Data.AppDbContext>();
    
    // 1. Chạy Migration chuẩn
    try {
        context.Database.Migrate();
    } catch (Exception ex) {
        Console.WriteLine($"[Migration Error] {ex.Message}");
    }

    // 2. Fix thủ công bảng AuditLogs (vì có thể Migration bị lệch)
    try {
        // Sử dụng DO block để check cột trong Postgres an toàn hơn
        context.Database.ExecuteSqlRaw(@"
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditLogs' AND column_name='EntityName') THEN
                    ALTER TABLE ""AuditLogs"" ADD COLUMN ""EntityName"" text DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditLogs' AND column_name='EntityId') THEN
                    ALTER TABLE ""AuditLogs"" ADD COLUMN ""EntityId"" text DEFAULT '';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditLogs' AND column_name='OldValues') THEN
                    ALTER TABLE ""AuditLogs"" ADD COLUMN ""OldValues"" text;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditLogs' AND column_name='NewValues') THEN
                    ALTER TABLE ""AuditLogs"" ADD COLUMN ""NewValues"" text;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='AuditLogs' AND column_name='ChangedBy') THEN
                    ALTER TABLE ""AuditLogs"" ADD COLUMN ""ChangedBy"" text;
                END IF;
                
                -- Luôn đảm bảo AdminUserId là nullable
                ALTER TABLE ""AuditLogs"" ALTER COLUMN ""AdminUserId"" DROP NOT NULL;
            END $$;
        ");
        Console.WriteLine("[SQL Fix] AuditLogs table checked and patched successfully.");
    } catch (Exception ex) {
        Console.WriteLine($"[SQL Fix Error] {ex.Message}");
    }

    ConnectDB.Data.SeedData.Initialize(context);
}

app.MapControllers();
app.MapHub<ConnectDB.Hubs.ShowtimeHub>("/hub/showtime");
app.UseHangfireDashboard("/admin/hangfire");

app.Run();