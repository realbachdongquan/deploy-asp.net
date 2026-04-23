using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.DTOs;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("my-tickets")]
    public async Task<IActionResult> GetMyTickets()
    {
        try 
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                            ?? User.FindFirstValue("sub");

            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized(new { message = "User ID not found in token" });
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized(new { message = "Invalid User ID format: " + userIdStr });

            var tickets = await _context.Tickets
                .Include(t => t.Showtime).ThenInclude(s => s != null ? s.Movie : null)
                .Include(t => t.Showtime).ThenInclude(s => s != null ? s.Room : null).ThenInclude(r => r != null ? r.Cinema : null)
                .Include(t => t.TicketSeats).ThenInclude(ts => ts.Seat)
                .Where(t => t.UserId == userId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync<Ticket>();

            return Ok(tickets);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, stack = ex.StackTrace });
        }
    }

    [HttpGet("debug/my-id")]
    public IActionResult GetMyId()
    {
        return Ok(new { 
            NameIdentifier = User.FindFirstValue(ClaimTypes.NameIdentifier),
             Sub = User.FindFirstValue("sub"),
            Email = User.FindFirstValue(ClaimTypes.Email),
            Claims = User.Claims.Select(c => new { c.Type, c.Value })
        });
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GetTickets([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime).ThenInclude(s => s != null ? s.Movie : null)
            .OrderByDescending(t => t.CreatedAt);

        var totalCount = await query.CountAsync();
        var tickets = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync<Ticket>();

        return Ok(new PagedResult<Ticket>(tickets, totalCount, page, pageSize));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime).ThenInclude(s => s != null ? s.Movie : null)
            .Include(t => t.TicketSeats).ThenInclude(ts => ts.Seat)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return NotFound();
        return Ok(ticket);
    }

    [HttpPost("verify/{bookingCode}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> VerifyTicket(string bookingCode)
    {
        var ticket = await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime).ThenInclude(s => s != null ? s.Movie : null)
            .Include(t => t.TicketSeats).ThenInclude(ts => ts.Seat)
            .FirstOrDefaultAsync(t => t.BookingCode == bookingCode);

        if (ticket == null) return NotFound(new { message = "Ticket not found" });

        if (ticket.PaymentStatus == "Used") 
            return BadRequest(new { message = "This ticket has already been used" });

        if (ticket.PaymentStatus != "Paid")
            return BadRequest(new { message = "Ticket is not paid yet" });

        ticket.PaymentStatus = "Used";
        await _context.SaveChangesAsync();

        return Ok(new { 
            message = "Ticket verified successfully",
            customer = ticket.User?.FullName,
            movie = ticket.Showtime?.Movie?.Title,
            seats = string.Join(", ", ticket.TicketSeats.Select(ts => (ts.Seat?.RowSymbol ?? "") + (ts.Seat?.ColumnNumber.ToString() ?? "")))
        });
    }
}
