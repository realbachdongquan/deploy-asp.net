using Microsoft.EntityFrameworkCore;
using ConnectDB.Models;

namespace ConnectDB.Data
{
    public static class SeedData
    {
        public static void Initialize(AppDbContext context)
        {
            // Clear all data for a fresh seed in development
            context.Database.EnsureDeleted();
            context.Database.EnsureCreated();

            // 1. Genres
            var action = new Genre { Name = "Action", Slug = "action" };
            var drama = new Genre { Name = "Drama", Slug = "drama" };
            var scifi = new Genre { Name = "Sci-Fi", Slug = "sci-fi" };
            var horror = new Genre { Name = "Horror", Slug = "horror" };
            var animation = new Genre { Name = "Animation", Slug = "animation" };
            var comedy = new Genre { Name = "Comedy", Slug = "comedy" };
            
            context.Genres.AddRange(action, drama, scifi, horror, animation, comedy);
            context.SaveChanges();

            // 2. Crew Members
            var nolan = new CrewMember { FullName = "Christopher Nolan", Bio = "Legendary director." };
            var villeneuve = new CrewMember { FullName = "Denis Villeneuve", Bio = "Sci-fi visionary." };
            var cap = new CrewMember { FullName = "Chris Evans", Bio = "Captain America." };
            var rdj = new CrewMember { FullName = "Robert Downey Jr.", Bio = "Iron Man." };
            var chalamet = new CrewMember { FullName = "Timothée Chalamet" };
            var zendaya = new CrewMember { FullName = "Zendaya" };
            var murphy = new CrewMember { FullName = "Cillian Murphy" };

            context.CrewMembers.AddRange(nolan, villeneuve, cap, rdj, chalamet, zendaya, murphy);
            context.SaveChanges();

            // 3. Cinemas & Rooms
            var cgvVincom = new Cinema { Name = "CGV Vincom Center", Address = "72 Lê Thánh Tôn, Quận 1", Status = true };
            var lotteCantavil = new Cinema { Name = "Lotte Cinema Cantavil", Address = "Quận 2, TP.HCM", Status = true };
            var galaxyNguyenDu = new Cinema { Name = "Galaxy Nguyễn Du", Address = "116 Nguyễn Du, Quận 1", Status = true };
            
            context.Cinemas.AddRange(cgvVincom, lotteCantavil, galaxyNguyenDu);
            context.SaveChanges();

            var room1 = new Room { Name = "IMAX 01", Capacity = 100, CinemaId = cgvVincom.Id };
            var room2 = new Room { Name = "Gold Class", Capacity = 30, CinemaId = cgvVincom.Id };
            var room3 = new Room { Name = "Cinema 03", Capacity = 80, CinemaId = lotteCantavil.Id };
            var room4 = new Room { Name = "Hall 01", Capacity = 120, CinemaId = galaxyNguyenDu.Id };
            
            context.Rooms.AddRange(room1, room2, room3, room4);
            context.SaveChanges();

            // 4. Seats Generation for all rooms
            var allRooms = new[] { room1, room2, room3, room4 };
            foreach (var room in allRooms)
            {
                int cols = 10;
                int rows = (int)Math.Ceiling((double)room.Capacity / cols);
                for (int r = 0; r < rows; r++)
                {
                    string rowSym = ((char)('A' + r)).ToString();
                    for (int c = 1; c <= cols; c++)
                    {
                        if ((r * cols + c) > room.Capacity) break;
                        context.Seats.Add(new Seat {
                            RoomId = room.Id,
                            RowSymbol = rowSym,
                            ColumnNumber = c,
                            SeatType = (r >= rows - 2) ? "VIP" : (r == 0 ? "Sweetbox" : "Standard"),
                            IsActive = true
                        });
                    }
                }
            }
            context.SaveChanges();

            // 5. Movies
            var m1 = new Movie { Title = "Oppenheimer", DurationMin = 180, ReleaseDate = DateTime.UtcNow.AddDays(-30), BasePrice = 85000, Status = "NowPlaying", PosterUrl = "https://m.media-amazon.com/images/M/MV5BMDBmYTZjNjUtN2M1Zi00N2MzLTk5ZGYtMWUxMzgwOTM2MzlhXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg" };
            var m2 = new Movie { Title = "Dune: Part Two", DurationMin = 166, ReleaseDate = DateTime.UtcNow.AddDays(-15), BasePrice = 90000, Status = "NowPlaying", PosterUrl = "https://m.media-amazon.com/images/M/MV5BN2QyZGU4ZDctOWMzMy00NTc5LThlOGQtODhmNDI1NmY5YzAwXkEyXkFqcGdeQXVyMDM2NDM2MQ@@._V1_.jpg" };
            var m3 = new Movie { Title = "Avengers: Endgame", DurationMin = 181, ReleaseDate = DateTime.UtcNow.AddYears(-5), BasePrice = 75000, Status = "Ended", PosterUrl = "https://m.media-amazon.com/images/M/MV5BMTc5MDE2ODcwNV5BMl5BanBnXkFtZTgwMzI2NzQ2NzM@._V1_.jpg" };
            var m4 = new Movie { Title = "Spider-Man: Across the Spider-Verse", DurationMin = 140, ReleaseDate = DateTime.UtcNow.AddDays(-40), BasePrice = 80000, Status = "NowPlaying", PosterUrl = "https://m.media-amazon.com/images/M/MV5BMzI0NmVkMjEtYmY4MS00ZDMxLTlkZmEtMzU4MDQxYTMzMjU2XkEyXkFqcGdeQXVyMzQ0MzA0NTM@._V1_.jpg" };
            var m5 = new Movie { Title = "Joker: Folie à Deux", DurationMin = 138, ReleaseDate = DateTime.UtcNow.AddMonths(2), BasePrice = 95000, Status = "ComingSoon", PosterUrl = "https://m.media-amazon.com/images/M/MV5BMzY4YjYyYjAtN2VjMi00N2VlLTg3M2QtZWU0M2I3YmY0ZWRkXkEyXkFqcGdeQXVyMTUzMTg2ODkz._V1_.jpg" };
            
            context.Movies.AddRange(m1, m2, m3, m4, m5);
            context.SaveChanges();

            // Junctions
            context.MovieGenres.AddRange(
                new MovieGenre { MovieId = m1.Id, GenreId = drama.Id },
                new MovieGenre { MovieId = m1.Id, GenreId = action.Id },
                new MovieGenre { MovieId = m2.Id, GenreId = scifi.Id },
                new MovieGenre { MovieId = m3.Id, GenreId = action.Id },
                new MovieGenre { MovieId = m4.Id, GenreId = animation.Id }
            );
            context.MovieCrews.AddRange(
                new MovieCrew { MovieId = m1.Id, CrewId = nolan.Id, Role = "Director" },
                new MovieCrew { MovieId = m1.Id, CrewId = murphy.Id, Role = "Actor", CharacterName = "J. Robert Oppenheimer" },
                new MovieCrew { MovieId = m2.Id, CrewId = villeneuve.Id, Role = "Director" },
                new MovieCrew { MovieId = m2.Id, CrewId = chalamet.Id, Role = "Actor", CharacterName = "Paul Atreides" }
            );
            context.SaveChanges();

            // 6. Users
            var admin = new User { Email = "admin@cinema.com", FullName = "System Administrator", PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123"), Role = "Admin", IsVerified = true };
            var user1 = new User { Email = "user@gmail.com", FullName = "Nguyen Van Khach", PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"), Role = "Customer", IsVerified = true };
            var user2 = new User { Email = "jane@example.com", FullName = "Jane Doe", PasswordHash = BCrypt.Net.BCrypt.HashPassword("user123"), Role = "Customer", IsVerified = true };
            
            context.Users.AddRange(admin, user1, user2);
            context.SaveChanges();

            // 7. Showtimes
            var now = DateTime.UtcNow;
            var st1 = new Showtime { MovieId = m1.Id, RoomId = room1.Id, StartTime = now.AddHours(2), EndTime = now.AddHours(5) };
            var st2 = new Showtime { MovieId = m2.Id, RoomId = room4.Id, StartTime = now.AddHours(1), EndTime = now.AddHours(4) };
            var st3 = new Showtime { MovieId = m4.Id, RoomId = room3.Id, StartTime = now.AddHours(3), EndTime = now.AddHours(6) };
            
            context.Showtimes.AddRange(st1, st2, st3);
            context.SaveChanges();

            // 8. Tickets & Payments
            var t1 = new Ticket { UserId = user1.Id, ShowtimeId = st1.Id, BookingCode = "OPPEN-555x", TotalPrice = 170000, PaymentStatus = "Paid" };
            context.Tickets.Add(t1);
            context.SaveChanges();

            var p1 = new Payment { TicketId = t1.Id, Amount = 170000, Status = "Success", Provider = "VNPay", PaidAt = now.AddMinutes(-30), TransactionId = "VNP12345678" };
            context.Payments.Add(p1);
            
            // 9. Concessions & Memberships
            context.Concessions.AddRange(
                new Concession { Name = "Combo Standard", Price = 99000, Category = "Combo" },
                new Concession { Name = "Large Popcorn", Price = 65000, Category = "Snack" },
                new Concession { Name = "Coca Cola", Price = 35000, Category = "Drink" }
            );

            context.Memberships.AddRange(
                new Membership { UserId = admin.Id, TierName = "Diamond", AccumulatedPoints = 5000 },
                new Membership { UserId = user1.Id, TierName = "Standard", AccumulatedPoints = 120 }
            );

            // 10. Audit Log
            context.AuditLogs.Add(new AuditLog { AdminUserId = admin.Id, Action = "Database Enterprise Seed", TargetTable = "System", IpAddress = "::1" });
            
            context.SaveChanges();
        }
    }
}
