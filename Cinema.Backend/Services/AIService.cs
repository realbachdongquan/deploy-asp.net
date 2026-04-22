using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace ConnectDB.Services;

public class AIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly string? _apiKey;

    public AIService(HttpClient httpClient, IConfiguration config)
    {
        _httpClient = httpClient;
        _config = config;
        _apiKey = _config["Gemini:ApiKey"];
    }

    public async Task<(string Sentiment, double Score)> AnalyzeSentimentAsync(string comment)
    {
        if (string.IsNullOrWhiteSpace(_apiKey)) return ("Neutral", 0.0);

        var prompt = $"Analyze the sentiment of this movie review in Vietnamese: \"{comment}\". " +
                     "Return only a JSON object with two fields: 'sentiment' (one of: Positive, Neutral, Negative) and 'score' (a number between -1.0 and 1.0). " +
                     "Example: {\"sentiment\": \"Positive\", \"score\": 0.8}";

        try
        {
            var response = await CallGeminiAsync(prompt);
            var result = JsonDocument.Parse(response);
            var text = result.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            // Clean up text if AI includes markdown block
            if (text != null && text.Contains("```json"))
            {
                text = text.Replace("```json", "").Replace("```", "").Trim();
            }

            var sentimentData = JsonSerializer.Deserialize<SentimentResult>(text ?? "{}");
            return (sentimentData?.Sentiment ?? "Neutral", sentimentData?.Score ?? 0.0);
        }
        catch
        {
            return ("Neutral", 0.0);
        }
    }

    public async Task<List<string>> GetMovieRecommendationsAsync(List<string> watchedMovieTitles, List<string> availableMovieTitles)
    {
        if (string.IsNullOrWhiteSpace(_apiKey) || !watchedMovieTitles.Any()) return new List<string>();

        var watchedList = string.Join(", ", watchedMovieTitles);
        var availableList = string.Join(", ", availableMovieTitles);

        var prompt = $"User has watched these movies: [{watchedList}]. " +
                     $"Based on these, recommend up to 5 movies from this available list: [{availableList}]. " +
                     "Return only a JSON array of strings containing the movie titles. " +
                     "Example: [\"Movie A\", \"Movie B\"]";

        try
        {
            var response = await CallGeminiAsync(prompt);
            var result = JsonDocument.Parse(response);
            var text = result.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text").GetString();

            if (text != null && text.Contains("```json"))
            {
                text = text.Replace("```json", "").Replace("```", "").Trim();
            }

            return JsonSerializer.Deserialize<List<string>>(text ?? "[]") ?? new List<string>();
        }
        catch
        {
            return new List<string>();
        }
    }

    private async Task<string> CallGeminiAsync(string prompt)
    {
        var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";
        
        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await _httpClient.PostAsync(url, content);
        response.EnsureSuccessStatusCode();
        
        return await response.Content.ReadAsStringAsync();
    }

    private class SentimentResult
    {
        [JsonPropertyName("sentiment")]
        public string Sentiment { get; set; } = "Neutral";
        
        [JsonPropertyName("score")]
        public double Score { get; set; } = 0.0;
    }
}
