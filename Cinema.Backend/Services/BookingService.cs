using ConnectDB.Data;
using ConnectDB.DTOs.Booking;
using ConnectDB.Hubs;
using ConnectDB.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace ConnectDB.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<ShowtimeHub> _hubContext;
    private readonly TimeSpan _lockDuration = TimeSpan.FromMinutes(5);

    public BookingService(AppDbContext context, IMemoryCache cache, IHubContext<ShowtimeHub> hubContext)
    {
        _context = context;
        _cache = cache;
        _hubContext = hubContext;
    }

    public async Task<List<SeatStatusDto>> GetSeatStatusesAsync(int showtimeId)
    {
        var showtime = await _context.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.Id == showtimeId);

        if (showtime == null) return new List<SeatStatusDto>();

        // 1. Get all actual seats in the room
        var seats = await _context.Seats
            .Where(s => s.RoomId == showtime.RoomId && s.IsActive)
            .ToListAsync();

        // 2. Get sold seats
        var soldSeatIds = await _context.TicketSeats
            .Where(ts => ts.Ticket.ShowtimeId == showtimeId && ts.Ticket.PaymentStatus != "Cancelled")
            .Select(ts => ts.SeatId)
            .ToListAsync();

        // 3. Get active locks from DB
        var activeLocks = await _context.SeatLocks
            .Where(sl => sl.ShowtimeId == showtimeId && sl.LockExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        return seats.Select(s => new SeatStatusDto
        {
            SeatId = s.Id,
            Row = s.RowSymbol,
            Column = s.ColumnNumber,
            Type = s.SeatType,
            Status = soldSeatIds.Contains(s.Id) ? "Occupied" : 
                     (activeLocks.Any(l => l.SeatId == s.Id) ? "Locked" : "Available"),
            LockedBy = activeLocks.FirstOrDefault(l => l.SeatId == s.Id)?.CreatedBy
        }).ToList();
    }

    public async Task<bool> LockSeatsAsync(int showtimeId, List<int> seatIds, int userId, string userEmail)
    {
        // Check if any seat is already sold or locked
        var alreadySold = await _context.TicketSeats
            .AnyAsync(ts => ts.Ticket.ShowtimeId == showtimeId && seatIds.Contains(ts.SeatId) && ts.Ticket.PaymentStatus != "Cancelled");
        
        if (alreadySold) return false;

        var alreadyLocked = await _context.SeatLocks
            .AnyAsync(sl => sl.ShowtimeId == showtimeId && seatIds.Contains(sl.SeatId) && sl.LockExpiresAt > DateTime.UtcNow && sl.UserId != userId);

        if (alreadyLocked) return false;

        // Apply locks
        foreach (var seatId in seatIds)
        {
            var existingLock = await _context.SeatLocks
                .FirstOrDefaultAsync(sl => sl.ShowtimeId == showtimeId && sl.SeatId == seatId);

            if (existingLock != null)
            {
                existingLock.UserId = userId;
                existingLock.LockExpiresAt = DateTime.UtcNow.Add(_lockDuration);
                existingLock.CreatedBy = userEmail;
            }
            else
            {
                _context.SeatLocks.Add(new SeatLock
                {
                    ShowtimeId = showtimeId,
                    SeatId = seatId,
                    UserId = userId,
                    LockToken = Guid.NewGuid().ToString(),
                    LockExpiresAt = DateTime.UtcNow.Add(_lockDuration),
                    CreatedBy = userEmail
                });
            }
        }

        await _context.SaveChangesAsync();

        // Notify SignalR with the updated seat list
        var updatedSeats = await GetSeatStatusesAsync(showtimeId);
        await _hubContext.Clients.Group($"Showtime_{showtimeId}").SendAsync("SeatStatusChanged", updatedSeats);

        return true;
    }

    public async Task<bool> UnlockSeatsAsync(int showtimeId, List<int> seatIds, int userId)
    {
        var locks = await _context.SeatLocks
            .Where(sl => sl.ShowtimeId == showtimeId && seatIds.Contains(sl.SeatId) && sl.UserId == userId)
            .ToListAsync();

        if (!locks.Any()) return false;

        _context.SeatLocks.RemoveRange(locks);
        await _context.SaveChangesAsync();

        // Notify SignalR with the updated seat list
        var updatedSeats = await GetSeatStatusesAsync(showtimeId);
        await _hubContext.Clients.Group($"Showtime_{showtimeId}").SendAsync("SeatStatusChanged", updatedSeats);

        return true;
    }

    public async Task<BookingResponse> CheckoutAsync(CheckoutRequest request, int userId, string userEmail)
    {
        var showtime = await _context.Showtimes
            .Include(s => s.Movie)
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.Id == request.ShowtimeId);

        if (showtime == null) throw new Exception("Showtime not found");

        var seats = await _context.Seats
            .Where(s => request.SeatIds.Contains(s.Id))
            .ToListAsync();

        // Calculate Price
        decimal totalAmount = 0;
        foreach (var seat in seats)
        {
            decimal seatPrice = showtime.Movie.BasePrice * showtime.CustomPriceMultiplier;
            if (seat.SeatType == "VIP") seatPrice += 20000;
            if (seat.SeatType == "Sweetbox") seatPrice += 40000;
            totalAmount += seatPrice;
        }

        // Create Ticket
        var ticket = new Ticket
        {
            UserId = userId,
            ShowtimeId = request.ShowtimeId,
            BookingCode = "BK" + DateTime.Now.Ticks.ToString().Substring(10),
            TotalPrice = totalAmount,
            PaymentStatus = "Paid", // Simplified for now
            CreatedBy = userEmail
        };

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        // Create Ticket Seats
        foreach (var seat in seats)
        {
            decimal seatPrice = showtime.Movie.BasePrice * showtime.CustomPriceMultiplier;
            if (seat.SeatType == "VIP") seatPrice += 20000;
            if (seat.SeatType == "Sweetbox") seatPrice += 40000;

            _context.TicketSeats.Add(new TicketSeat
            {
                TicketId = ticket.Id,
                SeatId = seat.Id,
                SoldPrice = seatPrice
            });
        }

        // Remove Locks
        var locks = await _context.SeatLocks
            .Where(sl => sl.ShowtimeId == request.ShowtimeId && request.SeatIds.Contains(sl.SeatId))
            .ToListAsync();
        _context.SeatLocks.RemoveRange(locks);

        await _context.SaveChangesAsync();

        // Notify SignalR with the updated seat list
        var updatedSeats = await GetSeatStatusesAsync(request.ShowtimeId);
        await _hubContext.Clients.Group($"Showtime_{request.ShowtimeId}").SendAsync("SeatStatusChanged", updatedSeats);

        return new BookingResponse
        {
            TicketId = ticket.Id,
            BookingCode = ticket.BookingCode,
            TotalAmount = totalAmount
        };
    }

    public async Task CleanupExpiredLocksAsync()
    {
        var expiredLocks = await _context.SeatLocks
            .Where(sl => sl.LockExpiresAt < DateTime.UtcNow)
            .ToListAsync();

        if (expiredLocks.Any())
        {
            _context.SeatLocks.RemoveRange(expiredLocks);
            await _context.SaveChangesAsync();
            
            // Note: In real life, we should notify SignalR groups of showtimes affected.
            // Simplified here.
        }
    }
}
