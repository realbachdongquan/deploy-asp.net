using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class UserWatchlist
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int MovieId { get; set; }

    public DateTime AddedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(20)]
    public string Status { get; set; } = "PlanToWatch"; // PlanToWatch, Watched

    [JsonIgnore]
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [ForeignKey("MovieId")]
    public Movie Movie { get; set; } = null!;
}
