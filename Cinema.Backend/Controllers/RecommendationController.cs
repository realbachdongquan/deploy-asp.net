using System.Security.Claims;
using ConnectDB.Data;
using ConnectDB.Models;
using ConnectDB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class RecommendationController : ControllerBase
{
    private readonly IAIService _aiService;
    private readonly AppDbContext _context;

    public RecommendationController(IAIService aiService, AppDbContext context)
    {
        _aiService = aiService;
        _context = context;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyRecommendations()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
        if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

        // 1. Lấy danh sách phim khách đã xem (từ vé đã thanh toán)
        var watchedMovieTitles = await _context.Tickets
            .Include(t => t.Showtime)
                .ThenInclude(s => s != null ? s.Movie : null)
            .Where(t => t.UserId == userId && t.PaymentStatus == "Paid")
            .Select(t => (t.Showtime != null && t.Showtime.Movie != null) ? t.Showtime.Movie.Title : "")
            .Where(title => title != "")
            .Distinct()
            .ToListAsync<string>();

        if (!watchedMovieTitles.Any())
        {
            // Nếu khách chưa xem phim nào, gợi ý top 5 phim mới nhất/hot nhất
            var topMovies = await _context.Movies
                .Where(m => m.Status == "Showing")
                .OrderByDescending(m => m.AverageRating)
                .Take(5)
                .ToListAsync<Movie>();
            return Ok(new { source = "Trending", recommendations = topMovies });
        }

        // 2. Lấy danh sách phim đang chiếu khả dụng
        var availableMovies = await _context.Movies
            .Where(m => m.Status == "Showing")
            .ToListAsync<Movie>();
        
        var availableTitles = availableMovies.Select(m => m.Title).ToList();

        // 3. Gọi AI để lấy danh sách tên phim gợi ý
        List<string> recommendedTitles = new();
        try 
        {
            recommendedTitles = await _aiService.GetMovieRecommendationsAsync(watchedMovieTitles, availableTitles);
        }
        catch (Exception ex)
        {
            // Log error but continue with fallback
            Console.WriteLine($"[AI Error] {ex.Message}");
        }

        // 4. Map tên phim về Object Movie đầy đủ
        var recommendations = availableMovies
            .Where(m => recommendedTitles.Contains(m.Title))
            .ToList();

        // Nếu AI không trả về kết quả (lỗi API), fallback về trending
        if (!recommendations.Any())
        {
             recommendations = availableMovies
                .OrderByDescending(m => m.AverageRating)
                .Take(5)
                .ToList();
        }

        return Ok(new { source = recommendedTitles.Any() ? "AI" : "Trending", recommendations });
    }
}
