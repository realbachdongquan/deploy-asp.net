 
using Microsoft.EntityFrameworkCore;  
using ConnectDB.Models;  

namespace ConnectDB.Data;  

public class AppDbContext : DbContext  
{  
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }  

    public DbSet<Movie> Movies { get; set; } = null!;  
    public DbSet<Cinema> Cinemas { get; set; } = null!;  
    public DbSet<Room> Rooms { get; set; } = null!;  

    protected override void OnModelCreating(ModelBuilder modelBuilder)  
    {  
        base.OnModelCreating(modelBuilder);  
    }  
}  
