using System.ComponentModel.DataAnnotations;

namespace ConnectDB.Models;

public class AuditLog
{
    [Key]
    public int Id { get; set; }

    public int AdminUserId { get; set; }

    [Required, MaxLength(100)]
    public string Action { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string TargetTable { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string TargetId { get; set; } = string.Empty;

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    [MaxLength(50)]
    public string? IpAddress { get; set; }
}
