using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ConnectDB.Data;
using ConnectDB.DTOs.Auth;
using ConnectDB.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace ConnectDB.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _config;
    private readonly IEmailService _emailService;

    public AuthService(AppDbContext context, IConfiguration config, IEmailService emailService)
    {
        _context = context;
        _config = config;
        _emailService = emailService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName ?? "",
                Role = user.Role
            }
        };
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("Email already exists");
        }

        var user = new User
        {
            Email = request.Email,
            FullName = request.FullName,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = "Customer"
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Create standard membership
        var membership = new Membership
        {
            UserId = user.Id,
            TierName = "Standard"
        };
        _context.Memberships.Add(membership);
        await _context.SaveChangesAsync();

        var token = GenerateJwtToken(user);

        // Generate Welcome Discount 20%
        var promoCode = $"WELCOME20-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}";
        var promotion = new Promotion
        {
            PromoCode = promoCode,
            Description = $"Welcome discount for {user.FullName}",
            DiscountPercentage = 20,
            MaxDiscountAmount = 100000,
            StartDate = ConnectDB.Utils.TimeUtils.GetVietnamTime(),
            EndDate = ConnectDB.Utils.TimeUtils.GetVietnamTime().AddDays(30),
            UsageLimit = 1,
            CurrentUsage = 0,
            SpecificEmail = user.Email,
            IsActive = true,
            IsPublic = false,
            MaxSeatsPerOrder = 3
        };

        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();

        var subject = "Chào mừng bạn đến với DWAN CINEMA - Quà tặng thành viên mới!";
        var body = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px;'>
                <h2 style='color: #E50914;'>Chào mừng {user.FullName}!</h2>
                <p>Cảm ơn bạn đã đăng ký thành viên tại DWAN CINEMA.</p>
                <p>Chúng tôi xin dành tặng bạn mã giảm giá <b>20%</b> cho lần đặt vé đầu tiên:</p>
                <div style='background: #f9f9f9; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #333; border: 2px dashed #E50914; margin: 20px 0;'>
                    {promoCode}
                </div>
                <p style='font-size: 0.9rem; color: #666;'>* Mã giảm giá này chỉ dành riêng cho email của bạn và có hiệu lực trong vòng 30 ngày.</p>
                <p>Chúc bạn có những giây phút giải trí tuyệt vời!</p>
                <hr style='border: none; border-top: 1px solid #eee; margin: 20px 0;'>
                <p style='font-size: 0.8rem; color: #999; text-align: center;'>Đội ngũ DWAN CINEMA</p>
            </div>";
        
        try
        {
            await _emailService.SendEmailAsync(user.Email, subject, body);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to send welcome email: {ex.Message}");
        }

        return new AuthResponse
        {
            Token = token,
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                Role = user.Role
            }
        };
    }

    private string GenerateJwtToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"] ?? ""));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("role", user.Role), 
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
