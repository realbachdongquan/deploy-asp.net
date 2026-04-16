using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Payment : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int TicketId { get; set; }

    [MaxLength(100)]
    public string? TransactionId { get; set; }

    [MaxLength(50)]
    public string Provider { get; set; } = "VNPay"; // VNPay, MoMo, Stripe

    [Required]
    public decimal Amount { get; set; }

    [Required, MaxLength(50)]
    public string Status { get; set; } = "Pending"; // Pending, Success, Failed

    public DateTime? PaidAt { get; set; }

    [JsonIgnore]
    [ForeignKey("TicketId")]
    public Ticket? Ticket { get; set; }
}
