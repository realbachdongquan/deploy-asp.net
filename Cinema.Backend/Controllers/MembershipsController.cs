using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.DTOs;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MembershipsController : ControllerBase
{
    private readonly AppDbContext _context;

    public MembershipsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GetMemberships([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Memberships.Include(m => m.User);
        var totalCount = await query.CountAsync();
        
        var membershipsList = await query
            .OrderByDescending(m => m.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync<Membership>();

        var result = membershipsList.Select(m => new {
            m.Id,
            m.UserId,
            UserEmail = m.User != null ? m.User.Email : "Unknown",
            m.TierName,
            m.AccumulatedPoints,
            m.ExpireDate
        }).ToList();

        return Ok(new PagedResult<object>(result, totalCount, page, pageSize));
    }

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyMembership()
    {
        try 
        {
            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier) ?? User.FindFirst("sub");
            if (userIdClaim == null) return Unauthorized(new { message = "User ID claim not found in token" });

            if (!int.TryParse(userIdClaim.Value, out int userId))
            {
                return BadRequest(new { message = $"Invalid User ID format in token: {userIdClaim.Value}" });
            }

            var membership = await _context.Memberships
                .FirstOrDefaultAsync(m => m.UserId == userId);

            if (membership == null)
            {
                // Verify user exists to avoid FK violation
                var userExists = await _context.Users.AnyAsync(u => u.Id == userId);
                if (!userExists) return NotFound(new { message = $"User with ID {userId} not found in database" });

                // Auto-create standard membership if not exists
                membership = new Membership { UserId = userId, TierName = "Standard", AccumulatedPoints = 0 };
                _context.Memberships.Add(membership);
                await _context.SaveChangesAsync();
            }

            return Ok(new { 
                id = membership.Id, 
                tierName = membership.TierName, 
                accumulatedPoints = membership.AccumulatedPoints,
                expireDate = membership.ExpireDate
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message, detail = ex.InnerException?.Message });
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GetMembership(int id)
    {
        var membership = await _context.Memberships
            .Include(m => m.User)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (membership == null) return NotFound();
        return Ok(membership);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> DeleteMembership(int id)
    {
        var membership = await _context.Memberships.FindAsync(id);
        if (membership == null) return NotFound();
        _context.Memberships.Remove(membership);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> CreateMembership(Membership membership)
    {
        _context.Memberships.Add(membership);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetMembership), new { id = membership.Id }, membership);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> UpdateMembership(int id, Membership membership)
    {
        if (id != membership.Id) return BadRequest();
        _context.Entry(membership).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
