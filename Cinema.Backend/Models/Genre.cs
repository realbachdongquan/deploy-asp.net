using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Genre : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Slug { get; set; } = string.Empty;

    [JsonIgnore]
    public ICollection<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
}
