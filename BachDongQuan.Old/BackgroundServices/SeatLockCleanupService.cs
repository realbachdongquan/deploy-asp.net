using ConnectDB.Services;

namespace ConnectDB.BackgroundServices;

public class SeatLockCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<SeatLockCleanupService> _logger;

    public SeatLockCleanupService(IServiceProvider serviceProvider, ILogger<SeatLockCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogInformation("SeatLock Cleanup Service is working.");

            using (var scope = _serviceProvider.CreateScope())
            {
                var bookingService = scope.ServiceProvider.GetRequiredService<IBookingService>();
                await bookingService.CleanupExpiredLocksAsync();
            }

            // Run every 1 minute
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
        }
    }
}
