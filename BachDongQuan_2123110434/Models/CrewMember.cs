using System.ComponentModel.DataAnnotations;

namespace ConnectDB.Models;

public class CrewMember : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? AvatarUrl { get; set; }

    public string? Bio { get; set; }

    // Navigation
    public ICollection<MovieCrew> MovieCrews { get; set; } = new List<MovieCrew>();
}
