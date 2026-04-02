using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SeatsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SeatsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetSeats()
    {
        return Ok(await _context.Seats.Include(s => s.Room).ToListAsync());
    }

    [HttpGet("room/{roomId}")]
    public async Task<IActionResult> GetSeatsByRoom(int roomId)
    {
        var seats = await _context.Seats
            .Where(s => s.RoomId == roomId)
            .OrderBy(s => s.RowSymbol)
            .ThenBy(s => s.ColumnNumber)
            .ToListAsync();

        return Ok(seats);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetSeat(int id)
    {
        var seat = await _context.Seats.FindAsync(id);
        if (seat == null) return NotFound();
        return Ok(seat);
    }

    [HttpPost]
    public async Task<IActionResult> CreateSeat(Seat seat)
    {
        _context.Seats.Add(seat);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetSeat), new { id = seat.Id }, seat);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSeat(int id, Seat seat)
    {
        if (id != seat.Id) return BadRequest();

        _context.Entry(seat).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Seats.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSeat(int id)
    {
        var seat = await _context.Seats.FindAsync(id);
        if (seat == null) return NotFound();

        _context.Seats.Remove(seat);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
