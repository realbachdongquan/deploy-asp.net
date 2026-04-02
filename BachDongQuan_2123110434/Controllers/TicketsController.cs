using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _context;

    public TicketsController(AppDbContext context)
    {
        _context = context;
    }

    // ADMIN: GET api/tickets
    [HttpGet]
    public async Task<IActionResult> GetTickets()
    {
        return Ok(await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime).ThenInclude(s => s.Movie)
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync());
    }

    // ADMIN/USER: GET api/tickets/id
    [HttpGet("{id}")]
    public async Task<IActionResult> GetTicket(int id)
    {
        var ticket = await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime).ThenInclude(s => s.Movie)
            .Include(t => t.TicketSeats).ThenInclude(ts => ts.Seat)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null) return NotFound();
        return Ok(ticket);
    }

    // NOTE: ticket reservation/booking flow will be implemented in a separate service/endpoint
    // This is just for bare CRUD administrative operations.
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTicket(int id)
    {
        var ticket = await _context.Tickets.FindAsync(id);
        if (ticket == null) return NotFound();

        _context.Tickets.Remove(ticket);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
