using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DungeonKeep.Infrastructure.Backstory;

public sealed class OpenAiBackstoryGenerator(HttpClient httpClient, IConfiguration configuration) : IBackstoryGenerator
{
    private const string DefaultModel = "gpt-4.1-mini";
    private const string DefaultResponsesUrl = "https://api.openai.com/v1/responses";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task<string> GenerateAsync(GenerateCharacterBackstoryRequest request, CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Set OpenAI__ApiKey before generating backstories.");
        }

        var responsesUrl = configuration["OpenAI:ResponsesUrl"] ?? DefaultResponsesUrl;
        var model = configuration["OpenAI:Model"] ?? DefaultModel;

        using var message = new HttpRequestMessage(HttpMethod.Post, responsesUrl)
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim())
            },
            Content = JsonContent.Create(new
            {
                model,
                temperature = 0.9,
                max_output_tokens = 700,
                input = BuildPrompt(request)
            })
        };

        using var response = await httpClient.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            throw new HttpRequestException($"OpenAI request failed ({(int)response.StatusCode}): {detail}", null, response.StatusCode);
        }

        var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
        var backstory = ExtractBackstory(payload);
        if (string.IsNullOrWhiteSpace(backstory))
        {
            throw new InvalidOperationException("The model returned no backstory text.");
        }

        return backstory;
    }

    private static string BuildPrompt(GenerateCharacterBackstoryRequest request)
    {
        return string.Join('\n',
        [
            "Write a Dungeons & Dragons character backstory with a warm fantasy tone.",
            "Make it specific and table-ready, with a clear past event, motivation, and current goal.",
            "Length: 3 short paragraphs plus 3 bullet plot hooks for a DM.",
            string.Empty,
            $"Class: {request.ClassName}",
            $"Background: {request.Background}",
            $"Species: {request.Species}",
            $"Alignment: {request.Alignment}",
            $"Lifestyle: {request.Lifestyle}",
            $"Personality Traits: {FormatCollection(request.PersonalityTraits, "No specific personality traits selected yet")}",
            $"Ideals: {FormatCollection(request.Ideals, "No ideals selected yet")}",
            $"Bonds: {FormatCollection(request.Bonds, "No bonds selected yet")}",
            $"Flaws: {FormatCollection(request.Flaws, "No flaws selected yet")}",
            string.IsNullOrWhiteSpace(request.AdditionalDirection)
                ? "Additional direction: none"
                : $"Additional direction: {request.AdditionalDirection.Trim()}",
            string.Empty,
            "Avoid contradiction with the provided details."
        ]);
    }

    private static string FormatCollection(string[] values, string fallback)
    {
        return values.Length > 0 ? string.Join("; ", values) : fallback;
    }

    private static string ExtractBackstory(OpenAiResponsesApiResponse? payload)
    {
        if (!string.IsNullOrWhiteSpace(payload?.OutputText))
        {
            return payload.OutputText.Trim();
        }

        var textParts = new List<string>();
        foreach (var item in payload?.Output ?? [])
        {
            foreach (var content in item.Content ?? [])
            {
                if (string.Equals(content.Type, "output_text", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(content.Text))
                {
                    textParts.Add(content.Text.Trim());
                }
            }
        }

        return string.Join("\n", textParts).Trim();
    }

    private sealed class OpenAiResponsesApiResponse
    {
        [JsonPropertyName("output_text")]
        public string? OutputText { get; init; }

        [JsonPropertyName("output")]
        public List<OpenAiResponseOutputItem>? Output { get; init; }
    }

    private sealed class OpenAiResponseOutputItem
    {
        [JsonPropertyName("content")]
        public List<OpenAiResponseContent>? Content { get; init; }
    }

    private sealed class OpenAiResponseContent
    {
        [JsonPropertyName("type")]
        public string? Type { get; init; }

        [JsonPropertyName("text")]
        public string? Text { get; init; }
    }
}