using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Seat : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RoomId { get; set; }

    [Required, MaxLength(5)]
    public string RowSymbol { get; set; } = string.Empty;

    [Required]
    public int ColumnNumber { get; set; }

    [MaxLength(20)]
    public string SeatType { get; set; } = "Standard"; // Standard, VIP, Sweetbox

    public bool IsActive { get; set; } = true;

    [JsonIgnore]
    [ForeignKey("RoomId")]
    public Room? Room { get; set; }
}