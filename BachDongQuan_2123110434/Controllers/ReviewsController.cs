using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReviewsController(AppDbContext context)
    {
        _context = context;
    }

    // GET: api/Reviews/movie/5
    [HttpGet("movie/{movieId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovieReviews(int movieId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.User)
            .Where(r => r.MovieId == movieId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id,
                r.Score,
                r.Comment,
                r.CreatedAt,
                r.LikesCount,
                User = new { r.User.FullName, r.User.AvatarUrl }
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllReviews()
    {
        var reviews = await _context.Reviews
            .Include(r => r.Movie)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new {
                r.Id,
                r.Score,
                r.Comment,
                r.CreatedAt,
                r.MovieId,
                Movie = new { r.Movie.Title },
                User = new { r.User.FullName }
            })
            .ToListAsync();
        return Ok(reviews);
    }

    // POST: api/Reviews
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> PostReview(Review review)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdStr == null) return Unauthorized();
        
        review.UserId = int.Parse(userIdStr);
        review.CreatedAt = DateTime.UtcNow;

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMovieReviews), new { movieId = review.MovieId }, review);
    }

    // DELETE: api/Reviews/5 (Admin or Owner)
    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        if (userRole != "Admin" && review.UserId.ToString() != userIdStr)
        {
            return Forbid();
        }

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
