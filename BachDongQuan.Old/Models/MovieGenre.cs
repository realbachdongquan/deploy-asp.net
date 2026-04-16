using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class MovieGenre
{
    public int MovieId { get; set; }
    [JsonIgnore]
    [ForeignKey("MovieId")]
    public Movie? Movie { get; set; }

    public int GenreId { get; set; }
    [ForeignKey("GenreId")]
    public Genre? Genre { get; set; }
}
