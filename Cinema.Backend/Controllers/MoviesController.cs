using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ConnectDB.DTOs;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ConnectDB.Services.IAIService _aiService;
    private readonly ConnectDB.Services.IAuditService _auditService;

    public MoviesController(AppDbContext context, ConnectDB.Services.IAIService aiService, ConnectDB.Services.IAuditService auditService)
    {
        _context = context;
        _aiService = aiService;
        _auditService = auditService;
    }

    // AI RECOMMENDATIONS (PRIVATE/PUBLIC): GET api/movies/recommendations
    [HttpGet("recommendations")]
    [AllowAnonymous]
    public async Task<IActionResult> GetRecommendations()
    {
        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out var userId))
        {
            var hotMovies = await _context.Movies
                .Where(m => m.Status == "NowPlaying")
                .OrderByDescending(m => m.ImdbScore)
                .Take(5)
                .ToListAsync<Movie>();
            return Ok(hotMovies);
        }

        var watchedMovieTitles = await _context.UserWatchlists
            .Where(w => w.UserId == userId && w.Status == "Watched")
            .Include(w => w.Movie)
            .Select(w => w.Movie != null ? w.Movie.Title : "")
            .Where(title => title != "")
            .ToListAsync<string>();

        if (!watchedMovieTitles.Any())
        {
            var hotMoviesList = await _context.Movies
                .Where(m => m.Status == "NowPlaying")
                .OrderByDescending(m => m.ImdbScore)
                .Take(5)
                .ToListAsync<Movie>();
            return Ok(hotMoviesList);
        }

        var availableMovies = await _context.Movies
            .Where(m => m.Status == "NowPlaying" || m.Status == "ComingSoon")
            .ToListAsync<Movie>();

        var availableTitles = availableMovies.Select(m => m.Title).ToList();

        var recommendedTitles = await _aiService.GetMovieRecommendationsAsync(watchedMovieTitles, availableTitles);

        var recommendedMovies = availableMovies
            .Where(m => recommendedTitles.Contains(m.Title))
            .ToList();

        if (!recommendedMovies.Any())
        {
            recommendedMovies = availableMovies.OrderByDescending(m => m.ImdbScore).Take(5).ToList();
        }

        return Ok(recommendedMovies);
    }

    // DISCOVERY (PUBLIC): GET api/movies?status=NowPlaying&cinemaId=5
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovies([FromQuery] string? status, [FromQuery] int? cinemaId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var query = _context.Movies.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(m => m.Status == status);
        }

        if (cinemaId.HasValue)
        {
            var movieIdsInCinema = await _context.Showtimes
                .Where(s => s.Room != null && s.Room.CinemaId == cinemaId.Value)
                .Select(s => s.MovieId)
                .Distinct()
                .ToListAsync<int>();
            
            query = query.Where(m => movieIdsInCinema.Contains(m.Id));
        }

        var totalCount = await query.CountAsync();
        var movies = await query
            .Include(m => m.MovieGenres).ThenInclude(mg => mg.Genre)
            .OrderByDescending(m => m.ReleaseDate)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync<Movie>();

        return Ok(new PagedResult<Movie>(movies, totalCount, page, pageSize));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovie(int id)
    {
        var movie = await _context.Movies
            .Include(m => m.MovieGenres).ThenInclude(mg => mg.Genre)
            .Include(m => m.MovieCrews).ThenInclude(mc => mc.CrewMember)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (movie == null) return NotFound();

        return Ok(movie);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> CreateMovie(Movie movie)
    {
        if (movie.MovieGenres != null)
        {
            foreach (var mg in movie.MovieGenres) mg.Genre = null!; 
        }
        if (movie.MovieCrews != null)
        {
            foreach (var mc in movie.MovieCrews) mc.CrewMember = null!;
        }

        _context.Movies.Add(movie);
        await _context.SaveChangesAsync();
        await _auditService.LogActionAsync("Create", "Movies", movie.Id.ToString());
        return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, movie);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> UpdateMovie(int id, Movie movie)
    {
        if (id != movie.Id) return BadRequest();

        var existingMovie = await _context.Movies
            .Include(m => m.MovieGenres)
            .Include(m => m.MovieCrews)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (existingMovie == null) return NotFound();

        _context.Entry(existingMovie).CurrentValues.SetValues(movie);

        existingMovie.MovieGenres.Clear();
        if (movie.MovieGenres != null)
        {
            foreach (var mg in movie.MovieGenres)
            {
                existingMovie.MovieGenres.Add(new MovieGenre { MovieId = id, GenreId = mg.GenreId });
            }
        }

        existingMovie.MovieCrews.Clear();
        if (movie.MovieCrews != null)
        {
            foreach (var mc in movie.MovieCrews)
            {
                existingMovie.MovieCrews.Add(new MovieCrew { MovieId = id, CrewId = mc.CrewId, Role = mc.Role, CharacterName = mc.CharacterName });
            }
        }

        try
        {
            await _context.SaveChangesAsync();
            await _auditService.LogActionAsync("Update", "Movies", id.ToString());
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Movies.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        var movie = await _context.Movies.FindAsync(id);
        if (movie == null) return NotFound();

        _context.Movies.Remove(movie);
        await _context.SaveChangesAsync();
        await _auditService.LogActionAsync("Delete", "Movies", id.ToString());

        return NoContent();
    }

    [HttpPost("generate-content")]
    [Authorize(Roles = "Admin,Manager,Staff")]
    public async Task<IActionResult> GenerateContent([FromBody] GenerateContentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return BadRequest("Title is required");
        var result = await _aiService.GenerateMovieContentAsync(request.Title);
        if (result == null) return StatusCode(500, "Failed to generate content");
        return Ok(result);
    }

    [HttpGet("crew/{crewId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMoviesByCrewMember(int crewId)
    {
        var movieCrews = await _context.MovieCrews
            .Where(mc => mc.CrewId == crewId)
            .Include(mc => mc.Movie)
            .ToListAsync<MovieCrew>();

        var result = movieCrews
            .Select(mc => mc.Movie)
            .Where(m => m != null)
            .Distinct()
            .ToList();

        return Ok(result);
    }

    public record GenerateContentRequest(string Title);
}
