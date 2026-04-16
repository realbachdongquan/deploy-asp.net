namespace ConnectDB.DTOs.Booking;

public class SeatStatusDto
{
    public int SeatId { get; set; }
    public string Status { get; set; } = "Available"; // Available, Locked, Occupied
    public string? LockedBy { get; set; }
    public string? Row { get; set; }
    public int Column { get; set; }
    public string? Type { get; set; }
}

public class LockSeatRequest
{
    public int ShowtimeId { get; set; }
    public List<int> SeatIds { get; set; } = new();
}

public class CheckoutRequest
{
    public int ShowtimeId { get; set; }
    public List<int> SeatIds { get; set; } = new();
    public List<int>? ConcessionIds { get; set; }
    public string PaymentMethod { get; set; } = "VNPAY";
}

public class BookingResponse
{
    public int TicketId { get; set; }
    public string BookingCode { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
}
