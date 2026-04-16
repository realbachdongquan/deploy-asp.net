using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Membership : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required, MaxLength(50)]
    public string TierName { get; set; } = "Standard"; // Standard, Gold, Diamond

    public int AccumulatedPoints { get; set; } = 0;

    public DateTime? ExpireDate { get; set; }

    [JsonIgnore]
    [ForeignKey("UserId")]
    public User? User { get; set; }
}
