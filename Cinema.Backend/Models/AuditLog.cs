using System.ComponentModel.DataAnnotations;

namespace ConnectDB.Models;

public class AuditLog
{
    [Key]
    public int Id { get; set; }
    
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Create, Update, Delete
    public string? OldValues { get; set; }
    public string? NewValues { get; set; }
    public string? ChangedBy { get; set; }
    public DateTime Timestamp { get; set; }

    // Backward compatibility fields
    public int? AdminUserId { get; set; }
    public string? TargetTable { get; set; }
    public string? TargetId { get; set; }
    public string? IpAddress { get; set; }
}
