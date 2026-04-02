using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ShowtimesController : ControllerBase
{
    private readonly AppDbContext _context;

    public ShowtimesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetShowtimes()
    {
        return Ok(await _context.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room).ThenInclude(r => r.Cinema)
            .OrderByDescending(s => s.StartTime)
            .ToListAsync());
    }

    [HttpGet("movie/{movieId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShowtimesByMovie(int movieId)
    {
        var showtimes = await _context.Showtimes
            .Include(s => s.Room).ThenInclude(r => r.Cinema)
            .Where(s => s.MovieId == movieId && s.StartTime > DateTime.UtcNow)
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return Ok(showtimes);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetShowtime(int id)
    {
        var showtime = await _context.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room).ThenInclude(r => r.Cinema)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (showtime == null) return NotFound();
        return Ok(showtime);
    }

    [HttpPost]
    public async Task<IActionResult> CreateShowtime(Showtime showtime)
    {
        _context.Showtimes.Add(showtime);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetShowtime), new { id = showtime.Id }, showtime);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateShowtime(int id, Showtime showtime)
    {
        if (id != showtime.Id) return BadRequest();

        _context.Entry(showtime).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Showtimes.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteShowtime(int id)
    {
        var showtime = await _context.Showtimes.FindAsync(id);
        if (showtime == null) return NotFound();

        _context.Showtimes.Remove(showtime);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
