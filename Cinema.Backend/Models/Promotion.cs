using System.ComponentModel.DataAnnotations;

namespace ConnectDB.Models;

public class Promotion : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string PromoCode { get; set; } = string.Empty;

    public string? Description { get; set; }

    public double DiscountPercentage { get; set; } = 0.0;

    public decimal MaxDiscountAmount { get; set; } = 0;

    [Required]
    public DateTime StartDate { get; set; }

    [Required]
    public DateTime EndDate { get; set; }

    public int UsageLimit { get; set; } = 100;

    public int CurrentUsage { get; set; } = 0;
}
