using ConnectDB.Data;
using ConnectDB.DTOs.Booking;
using ConnectDB.Hubs;
using ConnectDB.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace ConnectDB.Services;

public class BookingService : IBookingService
{
    private readonly AppDbContext _context;
    private readonly IMemoryCache _cache;
    private readonly IHubContext<ShowtimeHub> _hubContext;
    private readonly ILogger<BookingService> _logger;
    private readonly IBackgroundJobClient _jobClient;
    private readonly TimeSpan _lockDuration = TimeSpan.FromMinutes(10);

    public BookingService(AppDbContext context, IMemoryCache cache, IHubContext<ShowtimeHub> hubContext, ILogger<BookingService> logger, IBackgroundJobClient jobClient)
    {
        _context = context;
        _cache = cache;
        _hubContext = hubContext;
        _logger = logger;
        _jobClient = jobClient;
    }

    public async Task<List<SeatStatusDto>> GetSeatStatusesAsync(int showtimeId)
    {
        var showtime = await _context.Showtimes
            .Include(s => s.Room)
            .FirstOrDefaultAsync(s => s.Id == showtimeId);

        if (showtime == null) return new List<SeatStatusDto>();

        var seats = await _context.Seats
            .Where(s => s.RoomId == showtime.RoomId && s.IsActive)
            .ToListAsync();

        var soldSeatIds = await _context.TicketSeats
            .Where(ts => ts.Ticket != null && ts.Ticket.ShowtimeId == showtimeId && ts.Ticket.PaymentStatus != "Cancelled")
            .Select(ts => ts.SeatId)
            .ToListAsync();

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
        var alreadySold = await _context.TicketSeats
            .AnyAsync(ts => ts.Ticket != null && ts.Ticket.ShowtimeId == showtimeId && seatIds.Contains(ts.SeatId) && ts.Ticket.PaymentStatus != "Cancelled");
        
        if (alreadySold) return false;

        var now = DateTime.UtcNow;
        var alreadyLocked = await _context.SeatLocks
            .AnyAsync(sl => sl.ShowtimeId == showtimeId && seatIds.Contains(sl.SeatId) && sl.LockExpiresAt > now && sl.UserId != userId);

        if (alreadyLocked) return false;

        foreach (var seatId in seatIds)
        {
            // Chi tim lock con hieu luc (chua het han) - tranh zombie lock
            var existingActiveLock = await _context.SeatLocks
                .FirstOrDefaultAsync(sl => sl.ShowtimeId == showtimeId 
                                        && sl.SeatId == seatId 
                                        && sl.LockExpiresAt > now
                                        && sl.UserId == userId);

            // Xoa cac lock cu het han cua ghe nay
            var expiredLocks = await _context.SeatLocks
                .Where(sl => sl.ShowtimeId == showtimeId && sl.SeatId == seatId && sl.LockExpiresAt <= now)
                .ToListAsync();
            if (expiredLocks.Any()) _context.SeatLocks.RemoveRange(expiredLocks);

            if (existingActiveLock != null)
            {
                // Gia han lock hien tai
                existingActiveLock.LockExpiresAt = DateTime.SpecifyKind(now.Add(_lockDuration), DateTimeKind.Utc);
                existingActiveLock.CreatedBy = userEmail;
            }
            else
            {
                _context.SeatLocks.Add(new SeatLock
                {
                    ShowtimeId = showtimeId,
                    SeatId = seatId,
                    UserId = userId,
                    LockToken = Guid.NewGuid().ToString(),
                    LockExpiresAt = DateTime.SpecifyKind(now.Add(_lockDuration), DateTimeKind.Utc),
                    CreatedBy = userEmail
                });
            }
        }

        await _context.SaveChangesAsync();

        var updatedSeats = await GetSeatStatusesAsync(showtimeId);
        await _hubContext.Clients.Group($"Showtime_{showtimeId}").SendAsync("SeatStatusChanged", updatedSeats);

        // Schedule Hangfire job to release seats after duration
        // _jobClient.Schedule(() => ReleaseSeatsJob(showtimeId, seatIds, userId), _lockDuration);

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

        decimal totalAmount = 0;
        var now = ConnectDB.Utils.TimeUtils.GetVietnamTime();
        var isWeekend = showtime.StartTime.DayOfWeek == DayOfWeek.Saturday || showtime.StartTime.DayOfWeek == DayOfWeek.Sunday;
        var isPeakHour = showtime.StartTime.Hour >= 18 && showtime.StartTime.Hour <= 22;

        var user = await _context.Users.Include(u => u.Membership).FirstOrDefaultAsync(u => u.Id == userId);
        decimal memberDiscountPercent = 0;
        if (user?.Membership != null)
        {
            memberDiscountPercent = user.Membership.TierName switch
            {
                "Diamond" => 0.10m,
                "Gold" => 0.05m,
                _ => 0m
            };
        }

        foreach (var seat in seats)
        {
            decimal seatPrice = showtime.Movie!.BasePrice * showtime.CustomPriceMultiplier;
            
            if (seat.SeatType == "VIP") seatPrice += 20000;
            if (seat.SeatType == "Sweetbox") seatPrice += 40000;

            if (isWeekend) seatPrice *= 1.15m;
            if (isPeakHour) seatPrice *= 1.10m;
            seatPrice *= (1 - memberDiscountPercent);

            totalAmount += seatPrice;
        }

        if (request.Concessions != null && request.Concessions.Any())
        {
            var concessionIds = request.Concessions.Select(c => c.ConcessionId).ToList();
            var concessionItems = await _context.Concessions
                .Where(c => concessionIds.Contains(c.Id))
                .ToListAsync();

            foreach (var req in request.Concessions)
            {
                var item = concessionItems.FirstOrDefault(c => c.Id == req.ConcessionId);
                if (item != null)
                {
                    totalAmount += item.Price * req.Quantity;
                }
            }
        }

        var ticket = new Ticket
        {
            UserId = userId,
            ShowtimeId = request.ShowtimeId,
            BookingCode = "BK" + ConnectDB.Utils.TimeUtils.GetVietnamTime().Ticks.ToString().Substring(10),
            TotalPrice = totalAmount,
            PaymentStatus = "Pending", 
            CreatedBy = userEmail
        };

        if (request.UserPromotionId.HasValue || !string.IsNullOrEmpty(request.PromoCode))
        {
            Promotion? promo = null;
            UserPromotion? userPromo = null;

            if (request.UserPromotionId.HasValue)
            {
                userPromo = await _context.UserPromotions
                    .Include(up => up.Promotion)
                    .FirstOrDefaultAsync(up => up.Id == request.UserPromotionId && up.UserId == userId && !up.IsUsed);
                promo = userPromo?.Promotion;
            }
            else
            {
                promo = await _context.Promotions
                    .FirstOrDefaultAsync(p => p.PromoCode == request.PromoCode && 
                                             p.StartDate <= now && 
                                             p.EndDate >= now &&
                                             p.CurrentUsage < p.UsageLimit);
            }
            
            if (promo != null)
            {
                if (!string.IsNullOrEmpty(promo.SpecificEmail) && promo.SpecificEmail != user?.Email)
                {
                    return new BookingResponse { Success = false, Message = "Mã giảm giá này không dành cho tài khoản của bạn." };
                }

                if (promo.MaxSeatsPerOrder > 0 && request.SeatIds.Count > promo.MaxSeatsPerOrder)
                {
                    return new BookingResponse { Success = false, Message = $"Mã giảm giá này chỉ áp dụng cho tối đa {promo.MaxSeatsPerOrder} ghế." };
                }

                decimal discount = totalAmount * (decimal)(promo.DiscountPercentage / 100.0);
                
                if (promo.MaxDiscountAmount > 0 && discount > promo.MaxDiscountAmount)
                {
                    discount = promo.MaxDiscountAmount;
                }

                totalAmount -= discount;
                ticket.TotalPrice = totalAmount; 
                ticket.UserPromotionId = request.UserPromotionId;
                
                if (userPromo != null)
                {
                    // We don't mark as used here. 
                    // We wait for payment confirmation.
                    _logger.LogInformation($"Promo {promo.PromoCode} attached to ticket {ticket.BookingCode} for user {userId}. Usage will be finalized after payment.");
                }

                ticket.PromotionId = promo.Id;
                ticket.DiscountAmount = Math.Round(discount, 0);
                
                _logger.LogInformation($"Applied promo {promo.PromoCode}, discounted: {discount}");
            }
        }

        _context.Tickets.Add(ticket);
        await _context.SaveChangesAsync();

        foreach (var seat in seats)
        {
            decimal seatPrice = showtime.Movie!.BasePrice * showtime.CustomPriceMultiplier;
            if (seat.SeatType == "VIP") seatPrice += 20000;
            if (seat.SeatType == "Sweetbox") seatPrice += 40000;
            
            if (isWeekend) seatPrice *= 1.15m;
            if (isPeakHour) seatPrice *= 1.10m;
            seatPrice *= (1 - memberDiscountPercent);

            _context.TicketSeats.Add(new TicketSeat
            {
                TicketId = ticket.Id,
                SeatId = seat.Id,
                SoldPrice = Math.Round(seatPrice, 0)
            });
        }

        if (request.Concessions != null && request.Concessions.Any())
        {
            var concessionIds = request.Concessions.Select(c => c.ConcessionId).ToList();
            var concessionItems = await _context.Concessions
                .Where(c => concessionIds.Contains(c.Id))
                .ToListAsync();

            foreach (var req in request.Concessions)
            {
                var item = concessionItems.FirstOrDefault(c => c.Id == req.ConcessionId);
                if (item != null)
                {
                    _context.TicketConcessions.Add(new TicketConcession
                    {
                        TicketId = ticket.Id,
                        ConcessionId = item.Id,
                        Quantity = req.Quantity,
                        SoldPrice = item.Price,
                        SelectedOptions = req.SelectedOptions
                    });
                }
            }
        }

        var locks = await _context.SeatLocks
            .Where(sl => sl.ShowtimeId == request.ShowtimeId && request.SeatIds.Contains(sl.SeatId))
            .ToListAsync();
        _context.SeatLocks.RemoveRange(locks);

        await _context.SaveChangesAsync();

        var updatedSeats = await GetSeatStatusesAsync(request.ShowtimeId);
        await _hubContext.Clients.Group($"Showtime_{request.ShowtimeId}").SendAsync("SeatStatusChanged", updatedSeats);

        return new BookingResponse
        {
            TicketId = ticket.Id,
            BookingCode = ticket.BookingCode,
            TotalAmount = totalAmount,
            Success = true
        };
    }

    public async Task CleanupExpiredLocksAsync()
    {
        var now = DateTime.UtcNow;
        var expiredLocks = await _context.SeatLocks
            .Where(sl => sl.LockExpiresAt < now)
            .ToListAsync();

        if (expiredLocks.Any())
        {
            _context.SeatLocks.RemoveRange(expiredLocks);
            await _context.SaveChangesAsync();
        }
    }

    public async Task ReleaseSeatsJob(int showtimeId, List<int> seatIds, int userId)
    {
        _logger.LogInformation($"[Hangfire] Running auto-release for Showtime {showtimeId}, User {userId}, Seats: {string.Join(",", seatIds)}");
        
        var locks = await _context.SeatLocks
            .Where(sl => sl.ShowtimeId == showtimeId && seatIds.Contains(sl.SeatId) && sl.UserId == userId)
            .ToListAsync();

        if (locks.Any())
        {
            _context.SeatLocks.RemoveRange(locks);
            await _context.SaveChangesAsync();
            
            // Notify via SignalR
            var updatedSeats = await GetSeatStatusesAsync(showtimeId);
            await _hubContext.Clients.Group($"Showtime_{showtimeId}")
                .SendAsync("SeatStatusChanged", updatedSeats);
                
            _logger.LogInformation($"[Hangfire] Released {locks.Count} seats for Showtime {showtimeId}");
        }
    }
}
