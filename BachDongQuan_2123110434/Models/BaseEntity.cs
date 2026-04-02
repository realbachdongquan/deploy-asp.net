using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public abstract class BaseEntity
{
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    [MaxLength(255)]
    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }
    
    [MaxLength(255)]
    public string? UpdatedBy { get; set; }

    // Soft Delete Fields
    public bool IsDeleted { get; set; } = false;
    
    public DateTime? DeletedAt { get; set; }
    
    [MaxLength(255)]
    public string? DeletedBy { get; set; }
}
