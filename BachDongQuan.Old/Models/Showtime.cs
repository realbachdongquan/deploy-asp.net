using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Showtime : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MovieId { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required]
    public DateTime StartTime { get; set; }

    public DateTime EndTime { get; set; }

    public decimal CustomPriceMultiplier { get; set; } = 1.0m; // 1.5 for holiday, etc.

    public bool Status { get; set; } = true;

    [ForeignKey("MovieId")]
    public Movie? Movie { get; set; }

    [ForeignKey("RoomId")]
    public Room? Room { get; set; }
}