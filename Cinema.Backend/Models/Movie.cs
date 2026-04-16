using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Movie : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(255)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? OriginalTitle { get; set; }

    public string? Synopsis { get; set; }

    [Required]
    public DateTime ReleaseDate { get; set; }

    [Required]
    public int DurationMin { get; set; }

    [MaxLength(20)]
    public string? AgeRating { get; set; } // P, C13, C16, C18

    [MaxLength(500)]
    public string? PosterUrl { get; set; }
    
    [MaxLength(500)]
    public string? BackdropUrl { get; set; }

    [MaxLength(500)]
    public string? TrailerUrl { get; set; }

    [Required]
    public decimal BasePrice { get; set; } = 50000;

    public double ImdbScore { get; set; } = 0.0;

    [MaxLength(50)]
    public string Status { get; set; } = "ComingSoon"; // NowPlaying, ComingSoon, Ended

    // Navigation
    public ICollection<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
    public ICollection<MovieCrew> MovieCrews { get; set; } = new List<MovieCrew>();
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
    [JsonIgnore]
    public ICollection<Showtime> Showtimes { get; set; } = new List<Showtime>();
}