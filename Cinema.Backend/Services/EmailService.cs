using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace ConnectDB.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string htmlMessage)
        {
            var senderEmail = _config["EmailSettings:SenderEmail"];
            var appPassword = _config["EmailSettings:AppPassword"];
            var senderName = _config["EmailSettings:SenderName"];
            var smtpServer = _config["EmailSettings:SmtpServer"];
            var smtpPort = int.Parse(_config["EmailSettings:SmtpPort"] ?? "587");

            using (var message = new MailMessage())
            {
                message.From = new MailAddress(senderEmail!, senderName);
                message.To.Add(new MailAddress(toEmail));
                message.Subject = subject;
                message.Body = htmlMessage;
                message.IsBodyHtml = true;

                using (var client = new SmtpClient(smtpServer, smtpPort))
                {
                    client.EnableSsl = true;
                    client.Credentials = new NetworkCredential(senderEmail, appPassword);
                    await client.SendMailAsync(message);
                }
            }
        }

        public async Task SendTicketEmailAsync(string toEmail, string fullName, TicketEmailModel ticket)
        {
            string htmlTemplate = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px; border-radius: 15px;'>
                <div style='text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 20px;'>
                    <h1 style='color: #e50914; margin: 0;'>DWAN CINEMA</h1>
                    <p style='color: #888; margin: 5px 0 0 0;'>Your digital ticket is ready!</p>
                </div>
                
                <div style='padding: 30px 0;'>
                    <p>Hi <strong>{fullName}</strong>,</p>
                    <p>Thank you for choosing DWAN Cinema. Here is your booking information:</p>
                    
                    <div style='background: #111; padding: 20px; border-radius: 10px; margin: 20px 0; border: 1px solid #222;'>
                        <h2 style='margin-top: 0; color: #e50914;'>{ticket.MovieTitle}</h2>
                        <p style='margin: 5px 0;'><span style='color: #888;'>Cinema:</span> {ticket.CinemaName}</p>
                        <p style='margin: 5px 0;'><span style='color: #888;'>Room:</span> {ticket.RoomName}</p>
                        <p style='margin: 5px 0;'><span style='color: #888;'>Time:</span> {ticket.StartTime}</p>
                        <p style='margin: 5px 0;'><span style='color: #888;'>Seats:</span> <span style='color: #e50914; font-weight: bold;'>{ticket.Seats}</span></p>
                        <p style='margin: 5px 0;'><span style='color: #888;'>Total:</span> {ticket.TotalPrice:N0} VND</p>
                    </div>

                    <div style='text-align: center; margin-top: 30px;'>
                        <p style='color: #888; font-size: 0.8rem; margin-bottom: 10px;'>BOOKING CODE</p>
                        <div style='font-size: 2rem; font-weight: 900; letter-spacing: 5px; color: #fff; background: #222; padding: 15px; border-radius: 8px;'>
                            {ticket.BookingCode}
                        </div>
                    </div>
                </div>

                <div style='text-align: center; border-top: 1px solid #222; padding-top: 20px; color: #666; font-size: 0.8rem;'>
                    <p>Please present this email or the booking code at the cinema counter.</p>
                    <p>&copy; {DateTime.Now.Year} DWAN Cinema. All rights reserved.</p>
                </div>
            </div>";

            await SendEmailAsync(toEmail, $"[DWAN CINEMA] Booking Confirmation - {ticket.MovieTitle}", htmlTemplate);
        }

        public async Task SendPasswordResetEmailAsync(string toEmail, string fullName, string resetLink)
        {
            string htmlTemplate = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #000; color: #fff; padding: 20px; border-radius: 15px;'>
                <div style='text-align: center; border-bottom: 2px solid #e50914; padding-bottom: 20px;'>
                    <h1 style='color: #e50914; margin: 0;'>DWAN CINEMA</h1>
                    <p style='color: #888; margin: 5px 0 0 0;'>Security & Account Recovery</p>
                </div>
                
                <div style='padding: 30px 0; text-align: center;'>
                    <p>Chào <strong>{fullName}</strong>,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại DWAN Cinema.</p>
                    
                    <div style='margin: 40px 0;'>
                        <a href='{resetLink}' style='background: #e50914; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; border-radius: 5px; text-transform: uppercase;'>Đặt lại mật khẩu</a>
                    </div>

                    <p style='color: #888; font-size: 0.9rem;'>Liên kết này sẽ hết hạn sau 1 giờ.</p>
                    <p style='color: #888; font-size: 0.9rem;'>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>
                </div>

                <div style='text-align: center; border-top: 1px solid #222; padding-top: 20px; color: #666; font-size: 0.8rem;'>
                    <p>Đây là email tự động, vui lòng không phản hồi.</p>
                    <p>&copy; {DateTime.Now.Year} DWAN Cinema. All rights reserved.</p>
                </div>
            </div>";

            await SendEmailAsync(toEmail, "[DWAN CINEMA] Đặt lại mật khẩu của bạn", htmlTemplate);
        }
    }
}
