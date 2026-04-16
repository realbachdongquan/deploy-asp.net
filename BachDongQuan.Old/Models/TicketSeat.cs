using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class TicketSeat
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TicketId { get; set; }

    [Required]
    public int SeatId { get; set; }

    public decimal SoldPrice { get; set; }

    [JsonIgnore]
    [ForeignKey("TicketId")]
    public Ticket? Ticket { get; set; }

    [ForeignKey("SeatId")]
    public Seat? Seat { get; set; }
}
