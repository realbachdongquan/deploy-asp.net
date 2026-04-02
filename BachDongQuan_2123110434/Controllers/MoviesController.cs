using ConnectDB.Data;
using ConnectDB.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MoviesController : ControllerBase
{
    private readonly AppDbContext _context;

    public MoviesController(AppDbContext context)
    {
        _context = context;
    }

    // DISCOVERY (PUBLIC): GET api/movies?status=NowPlaying
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovies([FromQuery] string? status)
    {
        var query = _context.Movies.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(m => m.Status == status);
        }

        var movies = await query
            .Include(m => m.MovieGenres).ThenInclude(mg => mg.Genre)
            .OrderByDescending(m => m.ReleaseDate)
            .ToListAsync();

        return Ok(movies);
    }

    // DISCOVERY (PUBLIC): GET api/movies/id
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

    // ADMIN: POST api/movies
    [HttpPost]
    public async Task<IActionResult> CreateMovie(Movie movie)
    {
        // Ensure relations are not trying to create new genres/crew if they exist
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
        return CreatedAtAction(nameof(GetMovie), new { id = movie.Id }, movie);
    }

    // ADMIN: PUT api/movies/id
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMovie(int id, Movie movie)
    {
        if (id != movie.Id) return BadRequest();

        // 1. Dòng này để tránh lỗi Tracking trong EF
        var existingMovie = await _context.Movies
            .Include(m => m.MovieGenres)
            .Include(m => m.MovieCrews)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (existingMovie == null) return NotFound();

        // 2. Cập nhật thông tin cơ bản
        _context.Entry(existingMovie).CurrentValues.SetValues(movie);

        // 3. Đồng bộ Genres
        existingMovie.MovieGenres.Clear();
        foreach (var mg in movie.MovieGenres)
        {
            existingMovie.MovieGenres.Add(new MovieGenre { MovieId = id, GenreId = mg.GenreId });
        }

        // 4. Đồng bộ Crew
        existingMovie.MovieCrews.Clear();
        foreach (var mc in movie.MovieCrews)
        {
            existingMovie.MovieCrews.Add(new MovieCrew { MovieId = id, CrewId = mc.CrewId, Role = mc.Role, CharacterName = mc.CharacterName });
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Movies.Any(e => e.Id == id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    // ADMIN: DELETE api/movies/id
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovie(int id)
    {
        var movie = await _context.Movies.FindAsync(id);
        if (movie == null) return NotFound();

        _context.Movies.Remove(movie);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
