using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Room : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int CinemaId { get; set; }

    [Required, MaxLength(50)]
    public string Name { get; set; } = string.Empty;

    public int Capacity { get; set; }

    [MaxLength(20)]
    public string RoomFormat { get; set; } = "2D"; // 2D, 3D, IMAX, 4DX

    public bool Status { get; set; } = true;

    [ForeignKey("CinemaId")]
    public Cinema? Cinema { get; set; }

    [JsonIgnore]
    public ICollection<Seat>? Seats { get; set; } = new List<Seat>();
}