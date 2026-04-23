using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class TicketConcession
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TicketId { get; set; }

    [Required]
    public int ConcessionId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public decimal SoldPrice { get; set; }

    [JsonIgnore]
    [ForeignKey("TicketId")]
    public Ticket? Ticket { get; set; }

    [ForeignKey("ConcessionId")]
    public Concession? Concession { get; set; }

    public string? SelectedOptions { get; set; } // e.g., "Vị Phô mai, Nước Coca"
}
