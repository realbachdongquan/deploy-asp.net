using ConnectDB.Data;
using ConnectDB.Models;
using ConnectDB.DTOs;
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
    public async Task<IActionResult> GetMovieReviews(int movieId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Reviews
            .Include(r => r.User)
                .ThenInclude(u => u != null ? u.Membership : null)
            .Include(r => r.Cinema)
            .Where(r => r.MovieId == movieId)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        
        // Fetch entities first to avoid anonymous type inference issues with ToListAsync
        var reviewsList = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync<Review>();

        var result = reviewsList.Select(r => new {
            r.Id,
            r.Score,
            r.Comment,
            r.CreatedAt,
            r.LikesCount,
            r.Sentiment,
            CinemaName = r.Cinema != null ? r.Cinema.Name : "Unknown Cinema",
            User = new { 
                FullName = r.User != null ? r.User.FullName : "Anonymous", 
                AvatarUrl = r.User != null ? r.User.AvatarUrl : null,
                Tier = (r.User != null && r.User.Membership != null) ? r.User.Membership.TierName : "Standard"
            }
        }).ToList();

        return Ok(new PagedResult<object>(result, totalCount, page, pageSize));
    }

    [HttpPost("{id}/like")]
    [Authorize]
    public async Task<IActionResult> LikeReview(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null) return NotFound();

        review.LikesCount++;
        await _context.SaveChangesAsync();
        return Ok(new { likesCount = review.LikesCount });
    }

    [HttpGet("all")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GetAllReviews([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Reviews
            .Include(r => r.Movie)
            .Include(r => r.User)
            .Include(r => r.Cinema)
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        
        var reviewsList = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync<Review>();

        var result = reviewsList.Select(r => new {
            r.Id,
            r.Score,
            r.Comment,
            r.CreatedAt,
            r.MovieId,
            Movie = new { Title = r.Movie?.Title ?? "Unknown" },
            CinemaName = r.Cinema != null ? r.Cinema.Name : "Unknown Cinema",
            User = new { FullName = r.User?.FullName ?? "Unknown" }
        }).ToList();

        return Ok(new PagedResult<object>(result, totalCount, page, pageSize));
    }

    [HttpGet("recent")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRecentReviews([FromQuery] int count = 5)
    {
        var reviewsList = await _context.Reviews
            .Include(r => r.Movie)
            .Include(r => r.User)
            .OrderByDescending(r => r.CreatedAt)
            .Take(count)
            .ToListAsync<Review>();

        var result = reviewsList.Select(r => new {
            r.Id,
            r.Score,
            r.Comment,
            r.CreatedAt,
            r.MovieId,
            Movie = new { Title = r.Movie?.Title ?? "Unknown", PosterUrl = r.Movie?.PosterUrl },
            CinemaName = r.Cinema != null ? r.Cinema.Name : "Unknown Cinema",
            User = new { FullName = r.User?.FullName ?? "Unknown", AvatarUrl = r.User?.AvatarUrl }
        }).ToList();

        return Ok(result);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> PostReview(Review review)
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (userIdStr == null) return Unauthorized();
        int userId = int.Parse(userIdStr);

        var userTicket = await _context.Tickets
            .Include(t => t.Showtime)
                .ThenInclude(s => s != null ? s.Room : null)
            .Where(t => t.UserId == userId && 
                        t.Showtime != null && 
                        t.Showtime.MovieId == review.MovieId && 
                        t.PaymentStatus == "Paid")
            .OrderByDescending(t => t.Showtime!.StartTime)
            .FirstOrDefaultAsync();

        if (userTicket == null || userTicket.Showtime == null || userTicket.Showtime.Room == null)
        {
            return BadRequest(new { message = "You can only review movies you have purchased tickets for." });
        }

        review.CinemaId = userTicket.Showtime.Room.CinemaId;

        var existingReview = await _context.Reviews
            .FirstOrDefaultAsync(r => r.UserId == userId && r.MovieId == review.MovieId);
        
        if (existingReview != null)
        {
            return BadRequest(new { message = "You have already reviewed this movie." });
        }
        
        review.UserId = userId;
        review.CreatedAt = ConnectDB.Utils.TimeUtils.GetVietnamTime();

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        var movie = await _context.Movies.FindAsync(review.MovieId);
        if (movie != null)
        {
            var reviews = await _context.Reviews.Where(r => r.MovieId == review.MovieId).ToListAsync<Review>();
            movie.RatingCount = reviews.Count;
            movie.AverageRating = reviews.Average(r => (double)r.Score);
            await _context.SaveChangesAsync();
        }

        return CreatedAtAction(nameof(GetMovieReviews), new { movieId = review.MovieId }, review);
    }

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
