using ConnectDB.Data;
using ConnectDB.Models;
using ConnectDB.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ConnectDB.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IVnPayService _vnPayService;
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public PaymentController(IVnPayService vnPayService, AppDbContext context, IEmailService emailService)
        {
            _vnPayService = vnPayService;
            _context = context;
            _emailService = emailService;
        }

        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            if (response == null || response.VnPayResponseCode != "00")
            {
                // Payment failed or cancelled
                return Redirect("http://localhost:5173/payment-return?success=false");
            }

            // Note: We usually don't update DB here, we wait for IPN.
            // But for simple demo, we can redirect to a success page.
            return Redirect($"http://localhost:5173/payment-return?success=true&ticketId={response.OrderId}");
        }

        [HttpGet("vnpay-ipn")]
        public async Task<IActionResult> VnPayIpn()
        {
            Console.WriteLine("IPN Received: " + Request.QueryString);
            var response = _vnPayService.PaymentExecute(Request.Query);
            
            Console.WriteLine($"VNPAY Response: Success={response.Success}, Code={response.VnPayResponseCode}, TicketId={response.OrderId}");

            if (response.Success && response.VnPayResponseCode == "00")
            {
                Ticket? ticket = null;
                if (int.TryParse(response.OrderId, out int ticketId))
                {
                    ticket = await _context.Tickets
                        .Include(t => t.User)
                        .Include(t => t.Showtime).ThenInclude(s => s!.Movie)
                        .Include(t => t.Showtime).ThenInclude(s => s!.Room).ThenInclude(r => r!.Cinema)
                        .Include(t => t.TicketSeats).ThenInclude(ts => ts!.Seat)
                        .FirstOrDefaultAsync(t => t.Id == ticketId);
                }
                
                if (ticket == null)
                {
                    // Fallback to searching by BookingCode
                    ticket = await _context.Tickets
                        .Include(t => t.User)
                        .Include(t => t.Showtime).ThenInclude(s => s!.Movie)
                        .Include(t => t.Showtime).ThenInclude(s => s!.Room).ThenInclude(r => r!.Cinema)
                        .Include(t => t.TicketSeats).ThenInclude(ts => ts!.Seat)
                        .FirstOrDefaultAsync(t => t.BookingCode == response.OrderId);
                }

                if (ticket != null)
                    {
                        Console.WriteLine($"Ticket Found: {ticket.BookingCode}, Current Status: {ticket.PaymentStatus}");
                        if (ticket.PaymentStatus == "Pending")
                        {
                            ticket.PaymentStatus = "Paid";
                            
                            // Loyalty Point Logic
                            if (ticket.UserId > 0)
                            {
                                var membership = await _context.Memberships.FirstOrDefaultAsync(m => m.UserId == ticket.UserId);
                                if (membership == null)
                                {
                                    membership = new Membership { UserId = ticket.UserId, TierName = "Standard", AccumulatedPoints = 0 };
                                    _context.Memberships.Add(membership);
                                }

                                int earnedPoints = (int)(ticket.TotalPrice / 1000);
                                membership.AccumulatedPoints += earnedPoints;

                                // Tier Upgrading
                                if (membership.AccumulatedPoints >= 5000) membership.TierName = "Diamond";
                                else if (membership.AccumulatedPoints >= 1000) membership.TierName = "Gold";
                                else membership.TierName = "Standard";

                                Console.WriteLine($"Loyalty: User {ticket.UserId} earned {earnedPoints} pts. Total: {membership.AccumulatedPoints}. Tier: {membership.TierName}");
                            }

                            // Finalize Promotion Usage
                            if (ticket.UserPromotionId.HasValue)
                            {
                                var userPromo = await _context.UserPromotions.FindAsync(ticket.UserPromotionId.Value);
                                if (userPromo != null && !userPromo.IsUsed)
                                {
                                    userPromo.IsUsed = true;
                                    userPromo.UsedAt = ConnectDB.Utils.TimeUtils.GetVietnamTime();
                                    _context.Entry(userPromo).State = EntityState.Modified;
                                    Console.WriteLine($"Promotion Finalized: UserPromo {userPromo.Id} marked as used.");
                                }
                            }
                            else if (ticket.PromotionId.HasValue)
                            {
                                // If it was a direct code usage (not via Claim/UserPromotion)
                                // Increment CurrentUsage now that payment is confirmed.
                                await _context.Database.ExecuteSqlRawAsync(
                                    "UPDATE \"Promotions\" SET \"CurrentUsage\" = \"CurrentUsage\" + 1 " +
                                    "WHERE \"Id\" = {0} AND \"CurrentUsage\" < \"UsageLimit\"", ticket.PromotionId.Value);
                                Console.WriteLine($"Promotion Finalized: Direct Promo {ticket.PromotionId.Value} usage incremented.");
                            }

                            await _context.SaveChangesAsync();
                            Console.WriteLine("Ticket Status updated to Paid and Points updated.");
                        }

                        // Send Email (Send even if already Paid, for testing)
                        try 
                        {
                            Console.WriteLine($"Attempting to send email to: {ticket.User?.Email ?? ticket.CreatedBy}");
                            var emailModel = new TicketEmailModel
                            {
                                MovieTitle = ticket.Showtime?.Movie?.Title ?? "Movie",
                                CinemaName = ticket.Showtime?.Room?.Cinema?.Name ?? "Cinema",
                                RoomName = ticket.Showtime?.Room?.Name ?? "Room",
                                StartTime = ticket.Showtime?.StartTime.ToString("f") ?? "",
                                Seats = string.Join(", ", ticket.TicketSeats.Select(ts => (ts.Seat?.RowSymbol ?? "") + (ts.Seat?.ColumnNumber.ToString() ?? ""))),
                                BookingCode = ticket.BookingCode,
                                TotalPrice = ticket.TotalPrice,
                                TicketId = ticket.Id.ToString()
                            };

                            await _emailService.SendTicketEmailAsync(ticket.User?.Email ?? ticket.CreatedBy ?? "", ticket.User?.FullName ?? "Customer", emailModel);
                        }
                        catch (Exception ex)
                        {
                            // Log error but don't fail the payment
                            Console.WriteLine("Email Error: " + ex.Message);
                        }
                    }
                }

            // VNPAY requires specific response format for IPN
            return Ok(new { RspCode = "00", Message = "Confirm Success" });
        }
    }
}
