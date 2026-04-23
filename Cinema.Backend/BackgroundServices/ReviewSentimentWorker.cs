using ConnectDB.Data;
using ConnectDB.Services;
using Microsoft.EntityFrameworkCore;

namespace ConnectDB.BackgroundServices;

public class ReviewSentimentWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ReviewSentimentWorker> _logger;

    public ReviewSentimentWorker(IServiceProvider serviceProvider, ILogger<ReviewSentimentWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ReviewSentimentWorker is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var aiService = scope.ServiceProvider.GetRequiredService<IAIService>();

                // Get unprocessed reviews
                var unprocessedReviews = await dbContext.Reviews
                    .Where(r => r.Sentiment == null && !string.IsNullOrWhiteSpace(r.Comment))
                    .Take(10)
                    .ToListAsync(stoppingToken);

                if (unprocessedReviews.Any())
                {
                    _logger.LogInformation($"Processing {unprocessedReviews.Count} reviews for sentiment analysis.");
                    
                    foreach (var review in unprocessedReviews)
                    {
                        var (sentiment, score) = await aiService.AnalyzeSentimentAsync(review.Comment!);
                        review.Sentiment = sentiment;
                        review.SentimentScore = score;

                        // VIP Feature: Auto-Alert for Negative Sentiment
                        if (sentiment == "Negative" && score < -0.5)
                        {
                            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();
                            var adminEmail = "tt2.bdq@gmail.com"; // Default admin email
                            string alertSubject = $"[VIP ALERT] Negative Review Detected - Movie ID: {review.MovieId}";
                            string alertBody = $@"
                                <h3>Cảnh báo phản hồi tiêu cực!</h3>
                                <p>Hệ thống AI vừa phát hiện một đánh giá tiêu cực từ khách hàng.</p>
                                <hr/>
                                <p><strong>Nội dung:</strong> {review.Comment}</p>
                                <p><strong>Điểm AI:</strong> {score}</p>
                                <p><strong>Phim ID:</strong> {review.MovieId}</p>
                                <p>Vui lòng kiểm tra và phản hồi khách hàng sớm.</p>";
                            
                            await emailService.SendEmailAsync(adminEmail, alertSubject, alertBody);
                        }
                    }

                    await dbContext.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing sentiment analysis.");
            }

            // Wait 30 seconds before next poll
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }

        _logger.LogInformation("ReviewSentimentWorker is stopping.");
    }
}
