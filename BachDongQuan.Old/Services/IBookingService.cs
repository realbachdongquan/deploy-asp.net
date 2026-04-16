using ConnectDB.DTOs.Booking;

namespace ConnectDB.Services;

public interface IBookingService
{
    Task<List<SeatStatusDto>> GetSeatStatusesAsync(int showtimeId);
    Task<bool> LockSeatsAsync(int showtimeId, List<int> seatIds, int userId, string userEmail);
    Task<bool> UnlockSeatsAsync(int showtimeId, List<int> seatIds, int userId);
    Task<BookingResponse> CheckoutAsync(CheckoutRequest request, int userId, string userEmail);
    Task CleanupExpiredLocksAsync();
}
