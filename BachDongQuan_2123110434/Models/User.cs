using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class User : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, EmailAddress, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [JsonIgnore]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? FullName { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    [Required]
    public string Role { get; set; } = "Customer"; // Admin, CinemaManager, Customer

    public bool IsVerified { get; set; } = false;

    // Navigation Properties
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    public ICollection<UserWatchlist> Watchlists { get; set; } = new List<UserWatchlist>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
    public Membership? Membership { get; set; }
}