using System.Threading.Tasks;

namespace ConnectDB.Services
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string htmlMessage);
        Task SendTicketEmailAsync(string toEmail, string fullName, TicketEmailModel ticket);
        Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetLink);
    }

    public class TicketEmailModel
    {
        public string MovieTitle { get; set; } = string.Empty;
        public string CinemaName { get; set; } = string.Empty;
        public string RoomName { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string Seats { get; set; } = string.Empty;
        public string BookingCode { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public string TicketId { get; set; } = string.Empty;
    }
}
