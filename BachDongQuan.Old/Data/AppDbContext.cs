using Microsoft.EntityFrameworkCore;
using ConnectDB.Models;
using System.Security.Claims;

namespace ConnectDB.Data;

public class AppDbContext : DbContext
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AppDbContext(DbContextOptions<AppDbContext> options, IHttpContextAccessor httpContextAccessor) 
        : base(options) 
    {
        _httpContextAccessor = httpContextAccessor;
    }

    // IAM
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Membership> Memberships { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    // Catalog & Content
    public DbSet<Movie> Movies { get; set; } = null!;
    public DbSet<Genre> Genres { get; set; } = null!;
    public DbSet<MovieGenre> MovieGenres { get; set; } = null!;
    public DbSet<CrewMember> CrewMembers { get; set; } = null!;
    public DbSet<MovieCrew> MovieCrews { get; set; } = null!;
    public DbSet<Review> Reviews { get; set; } = null!;
    public DbSet<UserWatchlist> UserWatchlists { get; set; } = null!;

    // Infrastructure
    public DbSet<Cinema> Cinemas { get; set; } = null!;
    public DbSet<Room> Rooms { get; set; } = null!;
    public DbSet<Seat> Seats { get; set; } = null!;

    // Operations
    public DbSet<Showtime> Showtimes { get; set; } = null!;
    public DbSet<SeatLock> SeatLocks { get; set; } = null!;
    public DbSet<Ticket> Tickets { get; set; } = null!;
    public DbSet<TicketSeat> TicketSeats { get; set; } = null!;

    // Commerce
    public DbSet<Concession> Concessions { get; set; } = null!;
    public DbSet<TicketConcession> TicketConcessions { get; set; } = null!;
    public DbSet<Promotion> Promotions { get; set; } = null!;
    public DbSet<Payment> Payments { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // Ensure Email is unique
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // Many-to-Many configurations
        modelBuilder.Entity<MovieGenre>()
            .HasKey(mg => new { mg.MovieId, mg.GenreId });

        modelBuilder.Entity<MovieCrew>()
            .HasKey(mc => new { mc.MovieId, mc.CrewId, mc.Role });

        // Restrict delete for Ticket -> User
        modelBuilder.Entity<Ticket>()
            .HasOne(t => t.User)
            .WithMany(u => u.Tickets)
            .HasForeignKey(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Restrict delete for Showtime -> Movie
        modelBuilder.Entity<Showtime>()
            .HasOne(s => s.Movie)
            .WithMany(m => m.Showtimes)
            .HasForeignKey(s => s.MovieId)
            .OnDelete(DeleteBehavior.Restrict);
            
        // Restrict delete for Showtime -> Room
        modelBuilder.Entity<Showtime>()
            .HasOne(s => s.Room)
            .WithMany()
            .HasForeignKey(s => s.RoomId)
            .OnDelete(DeleteBehavior.Restrict);

        // Global Query Filter for Soft Delete
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                modelBuilder.Entity(entityType.ClrType).HasQueryFilter(ConvertFilterExpression(entityType.ClrType));
            }
        }
    }

    private static dynamic ConvertFilterExpression(Type type)
    {
        // Tạo lambda: e => !e.IsDeleted
        var parameter = System.Linq.Expressions.Expression.Parameter(type, "e");
        var property = System.Linq.Expressions.Expression.Property(parameter, "IsDeleted");
        var notDeleted = System.Linq.Expressions.Expression.Not(property);
        return System.Linq.Expressions.Expression.Lambda(notDeleted, parameter);
    }

    public override int SaveChanges()
    {
        ApplyAuditInfo();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditInfo();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditInfo()
    {
        var userEmail = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email) ?? "System";
        var entries = ChangeTracker.Entries<BaseEntity>();

        foreach (var entry in entries)
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    entry.Entity.CreatedBy = userEmail;
                    entry.Entity.IsDeleted = false;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    entry.Entity.UpdatedBy = userEmail;
                    break;
                case EntityState.Deleted:
                    // Soft Delete
                    entry.State = EntityState.Modified;
                    entry.Entity.IsDeleted = true;
                    entry.Entity.DeletedAt = DateTime.UtcNow;
                    entry.Entity.DeletedBy = userEmail;
                    break;
            }
        }
    }
}