using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ConcessionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ConcessionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetConcessions()
    {
        return Ok(await _context.Concessions.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetConcession(int id)
    {
        var concession = await _context.Concessions.FindAsync(id);
        if (concession == null) return NotFound();
        return Ok(concession);
    }

    [HttpPost]
    public async Task<IActionResult> CreateConcession(Concession concession)
    {
        _context.Concessions.Add(concession);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetConcession), new { id = concession.Id }, concession);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateConcession(int id, Concession concession)
    {
        if (id != concession.Id) return BadRequest();

        _context.Entry(concession).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Concessions.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteConcession(int id)
    {
        var concession = await _context.Concessions.FindAsync(id);
        if (concession == null) return NotFound();

        _context.Concessions.Remove(concession);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
