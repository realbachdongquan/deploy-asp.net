using ConnectDB.Models;
using ConnectDB.Services;
using ConnectDB.DTOs.Booking;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Cinema.Tests;

public class BookingServiceTests : TestBase
{
    private readonly BookingService _service;

    public BookingServiceTests()
    {
        _service = new BookingService(Context, MockCache.Object, MockHubContext.Object);
    }

    [Fact]
    public async Task CheckoutAsync_ShouldCalculateCorrectPrice_ForMixedSeatTypes()
    {
        // Arrange
        var movie = new Movie { Title = "Test Movie", BasePrice = 100000 };
        var room = new Room { Name = "Room 1" };
        var seatNormal = new Seat { Room = room, RowSymbol = "A", ColumnNumber = 1, SeatType = "Normal", IsActive = true };
        var seatVip = new Seat { Room = room, RowSymbol = "B", ColumnNumber = 1, SeatType = "VIP", IsActive = true };
        
        var showtime = new Showtime 
        { 
            Movie = movie, 
            Room = room, 
            StartTime = DateTime.Today.AddDays(1),
            CustomPriceMultiplier = 1.0m 
        };

        Context.Movies.Add(movie);
        Context.Rooms.Add(room);
        Context.Seats.AddRange(seatNormal, seatVip);
        Context.Showtimes.Add(showtime);
        await Context.SaveChangesAsync();

        var request = new CheckoutRequest 
        { 
            ShowtimeId = showtime.Id, 
            SeatIds = new List<int> { seatNormal.Id, seatVip.Id } 
        };

        // Act
        var result = await _service.CheckoutAsync(request, 1, "test@example.com");

        // Assert
        // Normal (100k) + VIP (120k) = 220k
        result.TotalAmount.Should().Be(220000);
        result.BookingCode.Should().StartWith("BK");
    }

    [Fact]
    public async Task LockSeatsAsync_ShouldReturnFalse_IfSeatIsAlreadyLockedByAnotherUser()
    {
        // Arrange
        var showtimeId = 1;
        var seatId = 10;
        var userId1 = 1;
        var userId2 = 2;

        Context.SeatLocks.Add(new SeatLock 
        { 
            ShowtimeId = showtimeId, 
            SeatId = seatId, 
            UserId = userId1, 
            LockExpiresAt = DateTime.UtcNow.AddMinutes(10) 
        });
        await Context.SaveChangesAsync();

        // Act
        var result = await _service.LockSeatsAsync(showtimeId, new List<int> { seatId }, userId2, "user2@test.com");

        // Assert
        result.Should().BeFalse();
    }
}
