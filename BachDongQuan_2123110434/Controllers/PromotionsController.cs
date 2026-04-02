using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin")]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PromotionsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetPromotions()
    {
        return Ok(await _context.Promotions.ToListAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetPromotion(int id)
    {
        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null) return NotFound();
        return Ok(promo);
    }

    [HttpPost]
    public async Task<IActionResult> CreatePromotion(Promotion promo)
    {
        _context.Promotions.Add(promo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetPromotion), new { id = promo.Id }, promo);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdatePromotion(int id, Promotion promo)
    {
        if (id != promo.Id) return BadRequest();
        _context.Entry(promo).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePromotion(int id)
    {
        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null) return NotFound();
        _context.Promotions.Remove(promo);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
