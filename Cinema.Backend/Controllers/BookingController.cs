using System.Security.Claims;
using ConnectDB.DTOs.Booking;
using ConnectDB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
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
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();
        
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "System";

        var result = await _bookingService.LockSeatsAsync(request.ShowtimeId, request.SeatIds, userId, userEmail);
        
        if (!result) return Conflict("Some seats are already locked or booked.");
        
        return Ok(new { Message = "Seats locked successfully." });
    }

    [HttpPost("unlock")]
    public async Task<IActionResult> UnlockSeats([FromBody] LockSeatRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        var result = await _bookingService.UnlockSeatsAsync(request.ShowtimeId, request.SeatIds, userId);
        
        if (!result) return BadRequest("Could not unlock these seats.");
        
        return Ok(new { Message = "Seats unlocked successfully." });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "System";

        try 
        {
            var response = await _bookingService.CheckoutAsync(request, userId, userEmail);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
