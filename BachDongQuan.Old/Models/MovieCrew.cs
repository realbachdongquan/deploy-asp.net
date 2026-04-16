using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class MovieCrew
{
    public int MovieId { get; set; }
    [JsonIgnore]
    [ForeignKey("MovieId")]
    public Movie? Movie { get; set; }

    public int CrewId { get; set; }
    [ForeignKey("CrewId")]
    public CrewMember? CrewMember { get; set; }

    [Required, MaxLength(50)]
    public string Role { get; set; } = "Actor"; // Director, Actor, Writer

    [MaxLength(100)]
    public string? CharacterName { get; set; }
}
