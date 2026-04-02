using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class SeatLock : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int ShowtimeId { get; set; }

    [Required]
    public int SeatId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required, MaxLength(100)]
    public string LockToken { get; set; } = string.Empty;

    [Required]
    public DateTime LockExpiresAt { get; set; }

    [JsonIgnore]
    [ForeignKey("ShowtimeId")]
    public Showtime Showtime { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("SeatId")]
    public Seat Seat { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}