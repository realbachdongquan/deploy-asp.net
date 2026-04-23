using System.Security.Claims;
using ConnectDB.DTOs.Booking;
using ConnectDB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ConnectDB.Controllers;

[EnableRateLimiting("fixed")]
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly IVnPayService _vnPayService;

    public BookingController(IBookingService bookingService, IVnPayService vnPayService)
    {
        _bookingService = bookingService;
        _vnPayService = vnPayService;
    }

    [HttpGet("seats/{showtimeId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSeats(int showtimeId)
    {
        var statuses = await _bookingService.GetSeatStatusesAsync(showtimeId);
        return Ok(statuses);
    }

    [HttpPost("lock")]
    public async Task<IActionResult> LockSeats([FromBody] LockSeatRequest request)
    {
        try
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                            ?? User.FindFirstValue("sub")
                            ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();
            
            var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "System";

            var result = await _bookingService.LockSeatsAsync(request.ShowtimeId, request.SeatIds, userId, userEmail);
            
            if (!result) return Conflict("Some seats are already locked or booked.");
            
            return Ok(new { Message = "Seats locked successfully." });
        }
        catch (Exception ex)
        {
            // Log chi tiet loi de debug tren Render logs
            Console.WriteLine($"[LockSeats ERROR] {ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}");
            return StatusCode(500, new { Error = ex.Message, Type = ex.GetType().Name });
        }
    }

    [HttpPost("unlock")]
    public async Task<IActionResult> UnlockSeats([FromBody] LockSeatRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                        ?? User.FindFirstValue("sub")
                        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        var result = await _bookingService.UnlockSeatsAsync(request.ShowtimeId, request.SeatIds, userId);
        
        if (!result) return BadRequest("Could not unlock these seats.");
        
        return Ok(new { Message = "Seats unlocked successfully." });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                        ?? User.FindFirstValue("sub")
                        ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);

        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "System";

        try 
        {
            var result = await _bookingService.CheckoutAsync(request, userId, userEmail);

            if (string.Equals(request.PaymentMethod, "VNPAY", StringComparison.OrdinalIgnoreCase))
            {
                var vnPayModel = new VnPaymentRequestModel
                {
                    Amount = (double)result.TotalAmount,
                    CreatedDate = DateTime.Now,
                    Description = $"{userEmail} thanh toan ve {result.BookingCode}",
                    FullName = userEmail,
                    TicketId = result.TicketId
                };
                result.PaymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, vnPayModel);
            }

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
