namespace ConnectDB.Services;

public record MovieContentResult(string Description, string Summary, string[] Tags);

public interface IAIService
{
    Task<(string Sentiment, double Score)> AnalyzeSentimentAsync(string comment);
    Task<List<string>> GetMovieRecommendationsAsync(List<string> watchedMovieTitles, List<string> availableMovieTitles);
    Task<MovieContentResult?> GenerateMovieContentAsync(string movieTitle);
    Task<string> GenerateRawTextAsync(string prompt);
}
