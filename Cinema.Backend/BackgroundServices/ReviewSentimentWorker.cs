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
