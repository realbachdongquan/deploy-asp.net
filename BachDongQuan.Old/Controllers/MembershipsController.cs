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
public class MembershipsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MembershipsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMemberships([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Memberships.Include(m => m.User);
        var totalCount = await query.CountAsync();
        var memberships = await query
            .OrderByDescending(m => m.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new {
                m.Id,
                m.UserId,
                UserEmail = m.User.Email,
                m.TierName,
                m.AccumulatedPoints,
                m.ExpireDate
            })
            .ToListAsync();
        return Ok(new PagedResult<object>(memberships, totalCount, page, pageSize));
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetMembership(int id)
    {
        var membership = await _context.Memberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (membership == null) return NotFound();
        return Ok(membership);
    }

    [HttpPost]
    public async Task<IActionResult> CreateMembership(Membership membership)
    {
        _context.Memberships.Add(membership);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMembership), new { id = membership.Id }, membership);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMembership(int id, Membership membership)
    {
        if (id != membership.Id) return BadRequest();
        _context.Entry(membership).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMembership(int id)
    {
        var membership = await _context.Memberships.FindAsync(id);
        if (membership == null) return NotFound();
        _context.Memberships.Remove(membership);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
