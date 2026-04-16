using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.DTOs;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class CrewMembersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CrewMembersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetCrewMembers([FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        var query = _context.CrewMembers.AsQueryable();
        var totalCount = await query.CountAsync();
        var members = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
        return Ok(new PagedResult<CrewMember>(members, totalCount, page, pageSize));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCrewMember(int id)
    {
        var crew = await _context.CrewMembers.FindAsync(id);
        if (crew == null) return NotFound();
        return Ok(crew);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCrewMember(CrewMember crew)
    {
        _context.CrewMembers.Add(crew);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetCrewMember), new { id = crew.Id }, crew);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCrewMember(int id, CrewMember crew)
    {
        if (id != crew.Id) return BadRequest();
        _context.Entry(crew).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCrewMember(int id)
    {
        var crew = await _context.CrewMembers.FindAsync(id);
        if (crew == null) return NotFound();
        _context.CrewMembers.Remove(crew);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
