using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Http;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ConnectDB.Services
{
    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public AuditService(AppDbContext context, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task LogActionAsync(string action, string targetTable, string targetId)
        {
            try
            {
                var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.NameIdentifier);
                int adminId = 0;
                if (!string.IsNullOrEmpty(userIdStr))
                {
                    int.TryParse(userIdStr, out adminId);
                }

                var ipAddress = _httpContextAccessor.HttpContext?.Connection?.RemoteIpAddress?.ToString();

                var log = new AuditLog
                {
                    AdminUserId = adminId,
                    Action = action,
                    TargetTable = targetTable,
                    TargetId = targetId,
                    Timestamp = DateTime.UtcNow,
                    IpAddress = ipAddress
                };

                _context.AuditLogs.Add(log);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // We don't want audit logging to break the main application logic
                Console.WriteLine($"Audit Logging Error: {ex.Message}");
            }
        }
    }
}
