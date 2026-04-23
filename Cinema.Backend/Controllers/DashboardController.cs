using ConnectDB.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize(Roles = "Admin,Manager,Staff")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var totalRevenue = await _context.Tickets
            .Where(t => t.PaymentStatus == "Paid")
            .SumAsync(t => t.TotalPrice);

        var totalTickets = await _context.Tickets.CountAsync();
        var totalMovies = await _context.Movies.CountAsync(m => m.Status == "NowPlaying");
        var totalUsers = await _context.Users.CountAsync();

        var recentBookings = await _context.Tickets
            .Include(t => t.User)
            .Include(t => t.Showtime)
                .ThenInclude(s => s != null ? s.Movie : null)
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new {
                t.Id,
                t.BookingCode,
                UserName = t.User != null ? t.User.FullName : "System",
                MovieTitle = (t.Showtime != null && t.Showtime.Movie != null) ? t.Showtime.Movie.Title : "Unknown",
                t.TotalPrice,
                t.CreatedAt
            })
            .ToListAsync();

        var topMoviesData = await _context.TicketSeats
            .Include(ts => ts.Ticket)
                .ThenInclude(t => t != null ? t.Showtime : null)
                    .ThenInclude(s => s != null ? s.Movie : null)
            .Where(ts => ts.Ticket != null && ts.Ticket.Showtime != null && ts.Ticket.Showtime.Movie != null)
            .ToListAsync();

        var topMovies = topMoviesData
            .GroupBy(ts => ts.Ticket!.Showtime!.Movie!.Title)
            .Select(g => new {
                Title = g.Key,
                Revenue = g.Sum(ts => ts.SoldPrice),
                TicketCount = g.Count()
            })
            .OrderByDescending(x => x.Revenue)
            .Take(5)
            .ToList();

        var now = ConnectDB.Utils.TimeUtils.GetVietnamTime();
        var revenueData = await _context.Tickets
            .Where(t => t.PaymentStatus == "Paid" && t.CreatedAt >= now.AddDays(-7))
            .GroupBy(t => t.CreatedAt.Date)
            .Select(g => new {
                Date = g.Key,
                Revenue = g.Sum(t => t.TotalPrice)
            })
            .OrderBy(x => x.Date)
            .ToListAsync();

        var last7DaysChart = Enumerable.Range(0, 7)
            .Select(i => now.Date.AddDays(-i))
            .OrderBy(d => d)
            .Select(day => new {
                Date = day.ToString("MM/dd"),
                Revenue = revenueData.FirstOrDefault(d => d.Date == day)?.Revenue ?? 0
            })
            .ToList();

        return Ok(new
        {
            TotalRevenue = totalRevenue,
            TotalTickets = totalTickets,
            TotalMovies = totalMovies,
            TotalUsers = totalUsers,
            RecentBookings = recentBookings,
            TopMovies = topMovies,
            RevenueChart = last7DaysChart
        });
    }
}
