using System.ComponentModel.DataAnnotations;

namespace ConnectDB.Models;

public class Concession : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public string? Description { get; set; }

    [MaxLength(500)]
    public string? ImageUrl { get; set; }

    [Required]
    public decimal Price { get; set; }

    [MaxLength(50)]
    public string Category { get; set; } = "Popcorn"; // Popcorn, Drink, Combo
}
