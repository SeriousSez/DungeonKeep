using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AssistantController(IAuthService authService, IHttpClientFactory httpClientFactory, IConfiguration configuration) : ControllerBase
{
    private const string DefaultModel = "gpt-4.1-mini";
    private const string DefaultResponsesUrl = "https://api.openai.com/v1/responses";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    [HttpPost("dnd-chat")]
    public async Task<ActionResult<DndChatResponse>> AskDndQuestion([FromBody] DndChatRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest("Question is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(title: "Assistant unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
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
                temperature = 0.3,
                max_output_tokens = 600,
                input = BuildChatInput(request)
            })
        };

        var client = httpClientFactory.CreateClient();
        using var response = await client.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            return Problem(title: "Assistant request failed.", detail: detail, statusCode: StatusCodes.Status502BadGateway);
        }

        var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
        var reply = ExtractResponseText(payload);
        if (string.IsNullOrWhiteSpace(reply))
        {
            return Problem(title: "Assistant response empty.", detail: "The model returned no text.", statusCode: StatusCodes.Status502BadGateway);
        }

        return Ok(new DndChatResponse(reply));
    }

    private static List<object> BuildChatInput(DndChatRequest request)
    {
        var input = new List<object>
        {
            new
            {
                role = "system",
                content = "You are a concise D&D 5e assistant for tabletop players. Answer rules questions clearly, include concrete examples, and call out when a ruling may vary by DM."
            }
        };

        var contextPrompt = BuildContextPrompt(request.PageContext);
        if (!string.IsNullOrWhiteSpace(contextPrompt))
        {
            input.Add(new
            {
                role = "system",
                content = contextPrompt
            });
        }

        foreach (var entry in request.History ?? [])
        {
            if (!string.Equals(entry.Role, "user", StringComparison.OrdinalIgnoreCase) &&
                !string.Equals(entry.Role, "assistant", StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (string.IsNullOrWhiteSpace(entry.Content))
            {
                continue;
            }

            input.Add(new
            {
                role = entry.Role.ToLowerInvariant(),
                content = entry.Content.Trim()
            });
        }

        input.Add(new
        {
            role = "user",
            content = request.Message.Trim()
        });

        return input;
    }

    private static string BuildContextPrompt(DndChatPageContext? context)
    {
        if (context is null)
        {
            return string.Empty;
        }

        var lines = new List<string>
        {
            "Current DungeonKeep page context is available below. Use it when it is relevant to the user's question. Do not invent missing facts.",
            $"Route: {context.Route}",
            $"Page Type: {context.PageType}"
        };

        if (context.Character is not null)
        {
            lines.AddRange(
            [
                "Character Context:",
                $"- Name: {context.Character.Name}",
                $"- Player: {context.Character.PlayerName}",
                $"- Race: {context.Character.Race}",
                $"- Class: {context.Character.ClassName}",
                $"- Level: {context.Character.Level}",
                $"- Role: {context.Character.Role}",
                $"- Status: {context.Character.Status}",
                $"- Background: {context.Character.Background}",
                $"- Armor Class: {context.Character.ArmorClass}",
                $"- Hit Points: {context.Character.HitPoints}/{context.Character.MaxHitPoints}",
                $"- Proficiency Bonus: {context.Character.ProficiencyBonus}",
                $"- Backstory: {FormatOptionalText(context.Character.Backstory, "none recorded")}",
                $"- Ability Scores: STR {context.Character.AbilityScores.Strength}, DEX {context.Character.AbilityScores.Dexterity}, CON {context.Character.AbilityScores.Constitution}, INT {context.Character.AbilityScores.Intelligence}, WIS {context.Character.AbilityScores.Wisdom}, CHA {context.Character.AbilityScores.Charisma}",
                $"- Race Traits: {FormatList(context.Character.RaceTraits, "none recorded")}",
                $"- Personality Traits: {FormatList(context.Character.PersonalityTraits, "none recorded")}",
                $"- Ideals: {FormatList(context.Character.Ideals, "none recorded")}",
                $"- Bonds: {FormatList(context.Character.Bonds, "none recorded")}",
                $"- Flaws: {FormatList(context.Character.Flaws, "none recorded")}"
            ]);
        }

        if (context.Campaign is not null)
        {
            lines.AddRange(
            [
                "Campaign Context:",
                $"- Name: {context.Campaign.Name}",
                $"- Setting: {context.Campaign.Setting}",
                $"- Tone: {context.Campaign.Tone}",
                $"- Summary: {context.Campaign.Summary}",
                $"- Hook: {context.Campaign.Hook}",
                $"- Next Session: {context.Campaign.NextSession}",
                $"- Player Count: {context.Campaign.PlayerCount}",
                $"- Party: {FormatParty(context.Campaign.Party)}",
                $"- Open Threads: {FormatList(context.Campaign.OpenThreads, "none recorded")}",
                $"- NPCs: {FormatList(context.Campaign.Npcs, "none recorded")}",
                $"- Loot: {FormatList(context.Campaign.Loot, "none recorded")}"
            ]);
        }

        return string.Join('\n', lines);
    }

    private static string FormatParty(IReadOnlyList<DndChatCampaignPartyMemberContext>? party)
    {
        if (party is null || party.Count == 0)
        {
            return "none recorded";
        }

        return string.Join(
            "; ",
            party.Select(member =>
                $"{member.Name} (Level {member.Level} {member.Race} {member.ClassName}, {member.Role}, {member.Status}; Background: {member.Background}; Backstory: {FormatOptionalText(member.Backstory, "none")}; Race Traits: {FormatList(member.RaceTraits, "none")}; Personality Traits: {FormatList(member.PersonalityTraits, "none")}; Ideals: {FormatList(member.Ideals, "none")}; Bonds: {FormatList(member.Bonds, "none")}; Flaws: {FormatList(member.Flaws, "none")})")
        );
    }

    private static string FormatList(IReadOnlyList<string>? values, string fallback)
    {
        if (values is null || values.Count == 0)
        {
            return fallback;
        }

        return string.Join(", ", values.Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim()));
    }

    private static string FormatOptionalText(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }

    private static string ExtractResponseText(OpenAiResponsesApiResponse? payload)
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

    private async Task<AuthenticatedUser?> GetAuthenticatedUserAsync(CancellationToken cancellationToken)
    {
        var authorization = Request.Headers.Authorization.ToString();
        var token = authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization[7..].Trim()
            : string.Empty;

        return await authService.GetAuthenticatedUserByTokenAsync(token, cancellationToken);
    }

    public sealed record DndChatRequest(string Message, IReadOnlyList<DndChatMessage>? History, DndChatPageContext? PageContext);

    public sealed record DndChatMessage(string Role, string Content);

    public sealed record DndChatPageContext(string Route, string PageType, DndChatCharacterContext? Character, DndChatCampaignContext? Campaign);

    public sealed record DndChatCharacterContext(
        string Id,
        string Name,
        string PlayerName,
        string Race,
        string ClassName,
        int Level,
        string Role,
        string Status,
        string Background,
        int ArmorClass,
        int HitPoints,
        int MaxHitPoints,
        int ProficiencyBonus,
        string Backstory,
        DndChatAbilityScores AbilityScores,
        IReadOnlyList<string> RaceTraits,
        IReadOnlyList<string> PersonalityTraits,
        IReadOnlyList<string> Ideals,
        IReadOnlyList<string> Bonds,
        IReadOnlyList<string> Flaws);

    public sealed record DndChatAbilityScores(int Strength, int Dexterity, int Constitution, int Intelligence, int Wisdom, int Charisma);

    public sealed record DndChatCampaignContext(
        string Id,
        string Name,
        string Setting,
        string Tone,
        string Summary,
        string Hook,
        string NextSession,
        int PlayerCount,
        IReadOnlyList<DndChatCampaignPartyMemberContext> Party,
        IReadOnlyList<string> OpenThreads,
        IReadOnlyList<string> Npcs,
        IReadOnlyList<string> Loot);

    public sealed record DndChatCampaignPartyMemberContext(
        string Id,
        string Name,
        string Race,
        string ClassName,
        int Level,
        string Role,
        string Status,
        string Background,
        string Backstory,
        IReadOnlyList<string> RaceTraits,
        IReadOnlyList<string> PersonalityTraits,
        IReadOnlyList<string> Ideals,
        IReadOnlyList<string> Bonds,
        IReadOnlyList<string> Flaws);

    public sealed record DndChatResponse(string Reply);

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
