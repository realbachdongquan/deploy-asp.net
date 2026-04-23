using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.DTOs;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Manager,Staff")]
public class CinemasController : ControllerBase
{
    private readonly AppDbContext _context;

    public CinemasController(AppDbContext context)
    {
        _context = context;
    }

    // DISCOVERY (PUBLIC): GET api/cinemas
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetCinemas([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Cinemas.Where(c => c.Status == true);
        var totalCount = await query.CountAsync();
        var cinemas = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new PagedResult<Cinema>(cinemas, totalCount, page, pageSize));
    }

    // DISCOVERY (PUBLIC): GET api/cinemas/id
    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCinema(int id)
    {
        var cinema = await _context.Cinemas
            .Include(c => c.Rooms)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cinema == null) return NotFound();

        return Ok(cinema);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCinema(Cinema cinema)
    {
        _context.Cinemas.Add(cinema);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCinema), new { id = cinema.Id }, cinema);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCinema(int id, Cinema cinema)
    {
        if (id != cinema.Id) return BadRequest();

        _context.Entry(cinema).State = EntityState.Modified;
        
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Cinemas.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCinema(int id)
    {
        var cinema = await _context.Cinemas.FindAsync(id);
        if (cinema == null) return NotFound();

        _context.Cinemas.Remove(cinema);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
