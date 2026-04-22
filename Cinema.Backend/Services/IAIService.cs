namespace ConnectDB.Services;

public interface IAIService
{
    Task<(string Sentiment, double Score)> AnalyzeSentimentAsync(string comment);
    Task<List<string>> GetMovieRecommendationsAsync(List<string> watchedMovieTitles, List<string> availableMovieTitles);
}
