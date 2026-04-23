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
    public DbSet<UserPromotion> UserPromotions { get; set; } = null!;
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

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var auditEntries = OnBeforeSaveChanges();
        var result = await base.SaveChangesAsync(cancellationToken);
        await OnAfterSaveChanges(auditEntries);
        return result;
    }

    public override int SaveChanges()
    {
        var auditEntries = OnBeforeSaveChanges();
        var result = base.SaveChanges();
        // Use Task.Run only if we are in a sync context but need to call async
        OnAfterSaveChanges(auditEntries).GetAwaiter().GetResult();
        return result;
    }

    private List<AuditEntry> OnBeforeSaveChanges()
    {
        ChangeTracker.DetectChanges();
        var auditEntries = new List<AuditEntry>();
        var userEmail = _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email) 
                         ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue("email") 
                         ?? "System";

        foreach (var entry in ChangeTracker.Entries())
        {
            if (entry.Entity is AuditLog || entry.State == EntityState.Detached || entry.State == EntityState.Unchanged)
                continue;

            var auditEntry = new AuditEntry(entry);
            auditEntry.EntityName = entry.Entity.GetType().Name;
            auditEntry.ChangedBy = userEmail;
            auditEntries.Add(auditEntry);

            foreach (var property in entry.Properties)
            {
                string propertyName = property.Metadata.Name;
                if (property.Metadata.IsPrimaryKey())
                {
                    auditEntry.KeyValues[propertyName] = property.CurrentValue;
                    continue;
                }

                switch (entry.State)
                {
                    case EntityState.Added:
                        auditEntry.Action = "Create";
                        auditEntry.NewValues[propertyName] = property.CurrentValue;
                        break;

                    case EntityState.Deleted:
                        auditEntry.Action = "Delete";
                        auditEntry.OldValues[propertyName] = property.OriginalValue;
                        break;

                    case EntityState.Modified:
                        if (property.IsModified)
                        {
                            auditEntry.Action = "Update";
                            auditEntry.OldValues[propertyName] = property.OriginalValue;
                            auditEntry.NewValues[propertyName] = property.CurrentValue;
                        }
                        break;
                }
            }

            // Also handle BaseEntity fields
            if (entry.Entity is BaseEntity baseEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        baseEntity.CreatedAt = DateTime.UtcNow;
                        baseEntity.CreatedBy = userEmail;
                        baseEntity.IsDeleted = false;
                        break;
                    case EntityState.Modified:
                        baseEntity.UpdatedAt = DateTime.UtcNow;
                        baseEntity.UpdatedBy = userEmail;
                        break;
                }
            }
        }

        return auditEntries;
    }

    private async Task OnAfterSaveChanges(List<AuditEntry> auditEntries)
    {
        if (auditEntries == null || auditEntries.Count == 0) return;

        foreach (var auditEntry in auditEntries)
        {
            AuditLogs.Add(auditEntry.ToAuditLog());
        }

        // Use base.SaveChangesAsync() to avoid triggering the audit interceptor again
        await base.SaveChangesAsync();
    }
}

public class AuditEntry
{
    public AuditEntry(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        Entry = entry;
    }

    public Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry Entry { get; }
    public string EntityName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string ChangedBy { get; set; } = string.Empty;
    public Dictionary<string, object?> KeyValues { get; } = new();
    public Dictionary<string, object?> OldValues { get; } = new();
    public Dictionary<string, object?> NewValues { get; } = new();

    public AuditLog ToAuditLog()
    {
        var audit = new AuditLog();
        audit.EntityName = EntityName;
        audit.Timestamp = DateTime.UtcNow;
        audit.Action = Action;
        audit.ChangedBy = ChangedBy;
        audit.EntityId = System.Text.Json.JsonSerializer.Serialize(KeyValues);
        audit.OldValues = OldValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(OldValues);
        audit.NewValues = NewValues.Count == 0 ? null : System.Text.Json.JsonSerializer.Serialize(NewValues);
        return audit;
    }
}