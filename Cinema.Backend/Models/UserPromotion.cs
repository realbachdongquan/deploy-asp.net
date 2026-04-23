using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ConnectDB.Models;

public class UserPromotion : BaseEntity
{
    [Key]
    public int Id { get; set; }

    public int UserId { get; set; }
    [ForeignKey("UserId")]
    public User? User { get; set; }

    public int PromotionId { get; set; }
    [ForeignKey("PromotionId")]
    public Promotion? Promotion { get; set; }

    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAt { get; set; }
}
