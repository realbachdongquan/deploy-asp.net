using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Cinema : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Slug { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    public int? CityId { get; set; }

    [MaxLength(20)]
    public string? Hotline { get; set; }

    public double? LocationLat { get; set; }
    public double? LocationLng { get; set; }

    public int? ManagerId { get; set; }

    public bool Status { get; set; } = true;

    [JsonIgnore]
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}