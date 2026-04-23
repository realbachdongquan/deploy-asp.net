using ConnectDB.DTOs.Auth;
using ConnectDB.Data;
using ConnectDB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using Microsoft.AspNetCore.RateLimiting;

namespace ConnectDB.Controllers;

[EnableRateLimiting("fixed")]
[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public AuthController(IAuthService authService, AppDbContext context, IEmailService emailService)
    {
        _authService = authService;
        _context = context;
        _emailService = emailService;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var response = await _authService.RegisterAsync(request);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpGet("profile")]
    [Authorize]
    public async Task<IActionResult> GetProfile()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            return Unauthorized();

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new {
                u.Id, u.Email, u.FullName, u.PhoneNumber, u.AvatarUrl, u.Role, u.IsVerified, u.CreatedAt
            })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound();

        var membership = await _context.Memberships
            .Where(m => m.UserId == userId)
            .Select(m => new { m.TierName, m.AccumulatedPoints, m.ExpireDate })
            .FirstOrDefaultAsync();

        var ticketCount = await _context.Tickets.CountAsync(t => t.UserId == userId);
        var totalSpent = await _context.Tickets
            .Where(t => t.UserId == userId && t.PaymentStatus == "Paid")
            .SumAsync(t => t.TotalPrice);
        var reviewCount = await _context.Reviews.CountAsync(r => r.UserId == userId);

        return Ok(new {
            user,
            membership,
            stats = new { ticketCount, totalSpent, reviewCount }
        });
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
        if (!string.IsNullOrEmpty(request.PhoneNumber)) user.PhoneNumber = request.PhoneNumber;
        if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl;

        await _context.SaveChangesAsync();

        return Ok(new { message = "Profile updated", user = new { user.Id, user.Email, user.FullName, user.PhoneNumber, user.AvatarUrl, user.Role } });
    }

    [HttpPut("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
        if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
            return Unauthorized();

        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Mật khẩu hiện tại không đúng" });

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đổi mật khẩu thành công" });
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) 
        {
            // For security, don't reveal that the user doesn't exist
            return Ok(new { message = "Nếu email tồn tại trong hệ thống, bạn sẽ nhận được link đặt lại mật khẩu." });
        }

        // Generate Token
        var token = Guid.NewGuid().ToString("N");
        user.ResetToken = token;
        user.ResetTokenExpiry = ConnectDB.Utils.TimeUtils.GetVietnamTime().AddHours(1);
        await _context.SaveChangesAsync();

        // Send Email
        var resetLink = $"http://localhost:5173/reset-password?token={token}";
        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName ?? user.Email, resetLink);

        return Ok(new { message = "Link đặt lại mật khẩu đã được gửi qua email của bạn." });
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => 
            u.ResetToken == request.Token && 
            u.ResetTokenExpiry > ConnectDB.Utils.TimeUtils.GetVietnamTime());

        if (user == null)
        {
            return BadRequest(new { message = "Mã xác thực không hợp lệ hoặc đã hết hạn." });
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.ResetToken = null;
        user.ResetTokenExpiry = null;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại." });
    }

    [HttpGet("me/debug")]
    [Authorize]
    public IActionResult DebugUser()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        var roles = User.Claims.Where(c => c.Type == System.Security.Claims.ClaimTypes.Role || c.Type == "role").Select(c => c.Value).ToList();
        
        return Ok(new {
            isAuthenticated = User.Identity?.IsAuthenticated,
            name = User.Identity?.Name,
            roleClaimType = ((System.Security.Claims.ClaimsIdentity)User.Identity!).RoleClaimType,
            claims,
            roles,
            isInAdminRole = User.IsInRole("Admin"),
            isInManagerRole = User.IsInRole("Manager"),
            isInStaffRole = User.IsInRole("Staff")
        });
    }

    [HttpGet("seed-fix")]
    [AllowAnonymous]
    public async Task<IActionResult> SeedFix()
    {
        var admin = await _context.Users.FirstOrDefaultAsync(u => u.Email == "admin@cinema.com");
        if (admin != null)
        {
            admin.Role = "Admin";
            await _context.SaveChangesAsync();
            return Ok(new { message = "Admin role fixed to 'Admin'", user = admin.Email, role = admin.Role });
        }
        return NotFound(new { message = "Admin user not found" });
    }

    [HttpGet("db-check")]
    [AllowAnonymous]
    public async Task<IActionResult> DbCheck()
    {
        var tables = new List<object>();
        try {
            var tableNames = new[] { "Users", "Movies", "Showtimes", "Tickets", "Promotions", "UserPromotions", "Reviews", "Cinemas", "Rooms", "Seats" };
            foreach (var name in tableNames) {
                try {
                    var count = await _context.Database.ExecuteSqlRawAsync($"SELECT COUNT(*) FROM \"{name}\"");
                    // Note: ExecuteSqlRawAsync returns the number of rows affected, not the result of SELECT.
                    // We need a different approach to get the count.
                    
                    // Better approach for simple diagnostic:
                    var actualCount = 0;
                    using (var command = _context.Database.GetDbConnection().CreateCommand())
                    {
                        command.CommandText = $"SELECT COUNT(*) FROM \"{name}\"";
                        _context.Database.OpenConnection();
                        actualCount = Convert.ToInt32(command.ExecuteScalar());
                    }
                    
                    tables.Add(new { table = name, count = actualCount, status = "OK" });
                } catch (Exception ex) {
                    tables.Add(new { table = name, status = "Error/Missing", error = ex.Message });
                }
            }
            return Ok(new { database = "Aiven PostgreSQL", tables });
        } catch (Exception ex) {
            return BadRequest(new { error = ex.Message });
        }
    }
}
