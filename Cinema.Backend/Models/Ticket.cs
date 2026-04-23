using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace ConnectDB.Models;

public class Ticket : BaseEntity
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [Required]
    public int ShowtimeId { get; set; }

    [Required, MaxLength(50)]
    public string BookingCode { get; set; } = string.Empty;

    public decimal TotalPrice { get; set; }

    [MaxLength(50)]
    public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Cancelled

    [JsonIgnore]
    [ForeignKey("UserId")]
    public User? User { get; set; }

    [ForeignKey("ShowtimeId")]
    public Showtime? Showtime { get; set; }

    public int? PromotionId { get; set; }
    public int? UserPromotionId { get; set; }
    public decimal DiscountAmount { get; set; } = 0;

    [ForeignKey("PromotionId")]
    public Promotion? Promotion { get; set; }

    [ForeignKey("UserPromotionId")]
    public UserPromotion? UserPromotion { get; set; }

    public ICollection<TicketSeat> TicketSeats { get; set; } = new List<TicketSeat>();
}