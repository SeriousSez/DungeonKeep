using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DungeonKeep.Infrastructure.Backstory;

public sealed class OpenAiCharacterPortraitGenerator(HttpClient httpClient, IConfiguration configuration) : ICharacterPortraitGenerator
{
    private const string DefaultImageModel = "gpt-image-1";
    private const string DefaultImagesUrl = "https://api.openai.com/v1/images/generations";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task<string> GenerateAsync(GenerateCharacterPortraitRequest request, CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Set OpenAI__ApiKey before generating portraits.");
        }

        var imagesUrl = configuration["OpenAI:ImagesUrl"] ?? DefaultImagesUrl;
        var model = configuration["OpenAI:ImageModel"] ?? DefaultImageModel;

        using var message = new HttpRequestMessage(HttpMethod.Post, imagesUrl)
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim())
            },
            Content = JsonContent.Create(new Dictionary<string, object?>
            {
                ["model"] = model,
                ["prompt"] = BuildPrompt(request),
                ["size"] = "1024x1024",
                ["quality"] = "high"
            })
        };

        using var response = await httpClient.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            throw new HttpRequestException($"OpenAI image request failed ({(int)response.StatusCode}): {detail}", null, response.StatusCode);
        }

        var payload = JsonSerializer.Deserialize<OpenAiImageApiResponse>(body, SerializerOptions);
        var imageBase64 = payload?.Data?
            .Select(item => item.B64Json)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

        if (string.IsNullOrWhiteSpace(imageBase64))
        {
            throw new InvalidOperationException("The image model returned no portrait.");
        }

        return $"data:image/png;base64,{imageBase64.Trim()}";
    }

    private static string BuildPrompt(GenerateCharacterPortraitRequest request)
    {
        var extraDirection = string.IsNullOrWhiteSpace(request.AdditionalDirection)
            ? "No extra direction provided."
            : request.AdditionalDirection.Trim();

        return string.Join('\n',
        [
            "Create a polished fantasy character portrait for a Dungeons & Dragons companion app.",
            "Use a single original subject in a chest-up or waist-up composition with clear face visibility.",
            "Keep the image richly fantasy, dramatic, and readable at small sizes.",
            "Do not add captions, logos, watermarks, UI, speech bubbles, or multiple characters.",
            "Avoid direct resemblance to real people or copyrighted character likenesses.",
            $"Character name: {request.Name}",
            $"Class: {request.ClassName}",
            $"Species: {request.Species}",
            $"Background: {request.Background}",
            $"Alignment: {request.Alignment}",
            string.IsNullOrWhiteSpace(request.Gender) ? "Gender presentation: unspecified" : $"Gender presentation: {request.Gender}",
            $"Additional direction: {extraDirection}"
        ]);
    }

    private sealed class OpenAiImageApiResponse
    {
        [JsonPropertyName("data")]
        public List<OpenAiImageDataItem>? Data { get; init; }
    }

    private sealed class OpenAiImageDataItem
    {
        [JsonPropertyName("b64_json")]
        public string? B64Json { get; init; }
    }
}