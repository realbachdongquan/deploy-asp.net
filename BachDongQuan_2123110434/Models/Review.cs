using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Review : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int MovieId { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    [Range(1, 10)]
    public int Score { get; set; }

    [MaxLength(2000)]
    public string? Comment { get; set; }

    public int LikesCount { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    [ForeignKey("MovieId")]
    public Movie Movie { get; set; } = null!;

    [JsonIgnore]
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
