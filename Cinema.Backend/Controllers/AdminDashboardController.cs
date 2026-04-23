using ConnectDB.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.Services;
using System.Linq;
using ConnectDB.Models;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Manager,Staff")]
public class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAIService _aiService;

    public AdminDashboardController(AppDbContext context, IAIService aiService)
    {
        _context = context;
        _aiService = aiService;
    }

    [HttpGet("revenue-stats")]
    public async Task<IActionResult> GetRevenueStats()
    {
        var last7Days = ConnectDB.Utils.TimeUtils.GetVietnamTime().AddDays(-7);
        
        // Fetch data with explicit type
        var tickets = await _context.Tickets
            .Where(t => t.PaymentStatus == "Paid" && t.CreatedAt >= last7Days)
            .ToListAsync<Ticket>();

        var stats = tickets
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new {
                Date = g.Key,
                Revenue = g.Sum(t => t.TotalPrice),
                TicketCount = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return Ok(stats);
    }

    [HttpGet("ai-movie-insights")]
    public async Task<IActionResult> GetAIMovieInsights()
    {
        var movies = await _context.Movies
            .Include(m => m.Reviews)
            .OrderByDescending(m => m.Reviews!.Count)
            .Take(5)
            .ToListAsync<Movie>();

        var moviesWithReviews = movies.Select(m => new {
            m.Id,
            m.Title,
            ReviewCount = m.Reviews?.Count ?? 0,
            AverageSentiment = (m.Reviews != null && m.Reviews.Any()) ? m.Reviews.Average(r => r.SentimentScore) : 0,
            RecentReviews = m.Reviews?.OrderByDescending(r => r.CreatedAt).Take(5).Select(r => r.Comment).ToList() ?? new List<string?>()
        }).ToList();

        var prompt = "Dựa trên dữ liệu sau đây hãy đưa ra nhận xét ngắn gọn về độ HOT và xu hướng của từng phim. Trả về định dạng JSON: { \"movieId\": string, \"insight\": string, \"trend\": \"Up\"|\"Down\"|\"Stable\" }.\n\n";
        prompt += System.Text.Json.JsonSerializer.Serialize(moviesWithReviews);

        try {
            var aiResult = await _aiService.GenerateRawTextAsync(prompt);
            return Ok(new { data = moviesWithReviews, aiAnalysis = aiResult });
        } catch {
            return Ok(new { data = moviesWithReviews, aiAnalysis = "AI hiện đang bận, vui lòng thử lại sau." });
        }
    }
}
