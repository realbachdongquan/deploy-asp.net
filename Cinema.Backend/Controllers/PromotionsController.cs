using ConnectDB.Data;
using ConnectDB.Models;
using ConnectDB.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PromotionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PromotionsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Promotions (Admin CRUD)
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> GetAllPromotions([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Promotions.AsQueryable();
        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(p => p.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new { items, total, page, pageSize });
    }

    // POST: api/Promotions (Admin CRUD)
    [HttpPost]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> CreatePromotion(Promotion promotion)
    {
        promotion.CreatedAt = TimeUtils.GetVietnamTime();
        _context.Promotions.Add(promotion);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAllPromotions), new { id = promotion.Id }, promotion);
    }

    // PUT: api/Promotions/{id} (Admin CRUD)
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> UpdatePromotion(int id, Promotion promotion)
    {
        if (id != promotion.Id) return BadRequest();
        
        promotion.UpdatedAt = TimeUtils.GetVietnamTime();
        _context.Entry(promotion).State = EntityState.Modified;
        
        try {
            await _context.SaveChangesAsync();
        } catch (DbUpdateConcurrencyException) {
            if (!await _context.Promotions.AnyAsync(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    // DELETE: api/Promotions/{id} (Admin CRUD)
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> DeletePromotion(int id)
    {
        var promo = await _context.Promotions.FindAsync(id);
        if (promo == null) return NotFound();

        _context.Promotions.Remove(promo);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // GET: api/Promotions/available
    [HttpGet("available")]
    [Authorize]
    public async Task<IActionResult> GetAvailablePromotions()
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();
        int userId = int.Parse(userIdStr);

        var now = TimeUtils.GetVietnamTime();

        // Promos that are:
        // 1. Active & Public
        // 2. Not expired
        // 3. Not reached usage limit
        // 4. Not already owned by the user
        var ownedPromoIds = await _context.UserPromotions
            .Where(up => up.UserId == userId)
            .Select(up => up.PromotionId)
            .ToListAsync();

        var promos = await _context.Promotions
            .Where(p => p.IsActive && p.IsPublic && 
                        p.StartDate <= now && p.EndDate >= now && 
                        p.CurrentUsage < p.UsageLimit &&
                        !ownedPromoIds.Contains(p.Id) &&
                        (p.SpecificEmail == null || p.SpecificEmail == ""))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(promos);
    }

    // GET: api/Promotions/my-promos
    [HttpGet("my-promos")]
    [Authorize]
    public async Task<IActionResult> GetMyPromotions([FromQuery] bool? isUsed = null)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();
        int userId = int.Parse(userIdStr);

        var query = _context.UserPromotions
            .Include(up => up.Promotion)
            .Where(up => up.UserId == userId);

        if (isUsed.HasValue)
        {
            query = query.Where(up => up.IsUsed == isUsed.Value);
        }

        var result = await query
            .OrderByDescending(up => up.CreatedAt)
            .Select(up => new {
                up.Id,
                up.IsUsed,
                up.UsedAt,
                up.CreatedAt,
                Promotion = up.Promotion
            })
            .ToListAsync();

        return Ok(result);
    }

    // POST: api/Promotions/claim/{id}
    [HttpPost("claim/{id}")]
    [Authorize]
    public async Task<IActionResult> ClaimPromotion(int id)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userIdStr == null) return Unauthorized();
        int userId = int.Parse(userIdStr);

        // 1. Check if already owned
        var exists = await _context.UserPromotions
            .AnyAsync(up => up.UserId == userId && up.PromotionId == id);
        
        if (exists) return BadRequest(new { message = "Bạn đã sở hữu mã giảm giá này rồi." });

        // 2. Atomic claim using SQL to handle concurrency (The 5 slot / 7 user problem)
        // We update the usage ONLY IF it's still below the limit.
        using var transaction = await _context.Database.BeginTransactionAsync();
        try {
            // This is the atomic part:
            var rowsAffected = await _context.Database.ExecuteSqlRawAsync(
                "UPDATE \"Promotions\" SET \"CurrentUsage\" = \"CurrentUsage\" + 1 " +
                "WHERE \"Id\" = {0} AND \"CurrentUsage\" < \"UsageLimit\" AND \"IsActive\" = true", id);

            if (rowsAffected == 0) {
                return BadRequest(new { message = "Mã giảm giá này đã hết lượt hoặc không còn khả dụng." });
            }

            // 3. Create the ownership record
            var userPromo = new UserPromotion
            {
                UserId = userId,
                PromotionId = id,
                IsUsed = false
            };

            _context.UserPromotions.Add(userPromo);
            await _context.SaveChangesAsync();
            
            await transaction.CommitAsync();

            return Ok(new { message = "Nhận mã giảm giá thành công!", id = userPromo.Id });
        } catch (Exception ex) {
            await transaction.RollbackAsync();
            return BadRequest(new { message = "Lỗi hệ thống: " + ex.Message });
        }
    }
}
