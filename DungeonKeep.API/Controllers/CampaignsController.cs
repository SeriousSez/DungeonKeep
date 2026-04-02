using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CampaignsController(ICampaignService campaignService, ICharacterService characterService, IAuthService authService, IHttpClientFactory httpClientFactory, IConfiguration configuration) : ControllerBase
{
    private const string DefaultModel = "gpt-4.1-mini";
    private const string DefaultResponsesUrl = "https://api.openai.com/v1/responses";
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CampaignDto>>> GetAll(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var campaigns = await campaignService.GetAllAsync(user.Id, cancellationToken);
        return Ok(campaigns);
    }

    [HttpPost]
    public async Task<ActionResult<CampaignDto>> Create([FromBody] CreateCampaignRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Campaign name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Setting))
        {
            return BadRequest("Campaign setting is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Hook))
        {
            return BadRequest("Campaign hook is required.");
        }

        if (request.LevelStart < 1 || request.LevelStart > 20)
        {
            return BadRequest("Campaign level start must be between 1 and 20.");
        }

        if (request.LevelEnd < request.LevelStart || request.LevelEnd > 20)
        {
            return BadRequest("Campaign level end must be between level start and 20.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var created = await campaignService.CreateAsync(request, user, cancellationToken);
        return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
    }

    [HttpPut("{campaignId:guid}")]
    public async Task<ActionResult<CampaignDto>> Update(Guid campaignId, [FromBody] UpdateCampaignRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Campaign name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Setting))
        {
            return BadRequest("Campaign setting is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Hook))
        {
            return BadRequest("Campaign hook is required.");
        }

        if (request.LevelStart < 1 || request.LevelStart > 20)
        {
            return BadRequest("Campaign level start must be between 1 and 20.");
        }

        if (request.LevelEnd < request.LevelStart || request.LevelEnd > 20)
        {
            return BadRequest("Campaign level end must be between level start and 20.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.UpdateAsync(campaignId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign was not found.");
        }

        return Ok(updated);
    }

    [HttpPost("generate-draft")]
    public async Task<ActionResult<GenerateCampaignDraftResponse>> GenerateDraft([FromBody] GenerateCampaignDraftRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(title: "Campaign generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
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
                temperature = 0.8,
                max_output_tokens = 650,
                input = BuildCampaignDraftPrompt(request)
            })
        };

        var client = httpClientFactory.CreateClient();
        using var response = await client.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            return Problem(title: "Campaign generation failed.", detail: detail, statusCode: StatusCodes.Status502BadGateway);
        }

        var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
        var text = ExtractResponseText(payload);
        if (string.IsNullOrWhiteSpace(text))
        {
            return Problem(title: "Campaign generation failed.", detail: "The model returned no text.", statusCode: StatusCodes.Status502BadGateway);
        }

        var generated = TryParseGeneratedCampaignDraftPayload(text);

        if (generated is null)
        {
            return Problem(title: "Campaign generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
        }

        var normalizedTone = NormalizeTone(generated.Tone, request.Tone);
        var normalizedSetting = string.IsNullOrWhiteSpace(generated.Setting)
            ? (request.SettingHint?.Trim() ?? string.Empty)
            : generated.Setting.Trim();

        var draft = new GenerateCampaignDraftResponse(
            Name: string.IsNullOrWhiteSpace(generated.Name) ? "Generated Campaign" : generated.Name.Trim(),
            Setting: normalizedSetting,
            Tone: normalizedTone,
            LevelStart: NormalizeLevel(generated.LevelStart, request.LevelStart, 1),
            LevelEnd: NormalizeLevel(generated.LevelEnd, request.LevelEnd, 4),
            Hook: string.IsNullOrWhiteSpace(generated.Hook) ? "A volatile mystery erupts and drags the party into the center of it." : generated.Hook.Trim(),
            NextSession: string.IsNullOrWhiteSpace(generated.NextSession) ? string.Empty : generated.NextSession.Trim(),
            Summary: string.IsNullOrWhiteSpace(generated.Summary) ? "A generated campaign draft ready for your table." : generated.Summary.Trim()
        );

        if (draft.LevelEnd < draft.LevelStart)
        {
            draft = draft with { LevelEnd = draft.LevelStart };
        }

        if (string.IsNullOrWhiteSpace(draft.Setting) || string.IsNullOrWhiteSpace(draft.Hook))
        {
            return Problem(title: "Campaign generation failed.", detail: "Model response missed required campaign fields.", statusCode: StatusCodes.Status502BadGateway);
        }

        return Ok(draft);
    }

    [HttpGet("{campaignId:guid}/characters")]
    public async Task<ActionResult<IReadOnlyList<CharacterDto>>> GetCharacters(Guid campaignId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var characters = await characterService.GetByCampaignAsync(campaignId, user.Id, cancellationToken);
            return Ok(characters);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/characters")]
    public async Task<ActionResult<CharacterDto>> CreateCharacter(Guid campaignId, [FromBody] CreateCharacterRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.ClassName))
        {
            return BadRequest("Character name and class are required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var created = await characterService.CreateAsync(campaignId, request, user, cancellationToken);
            return CreatedAtAction(nameof(GetCharacters), new { campaignId }, created);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException)
        {
            return NotFound("Campaign was not found.");
        }
    }

    [HttpPost("{campaignId:guid}/threads")]
    public async Task<ActionResult<CampaignDto>> CreateThread(Guid campaignId, [FromBody] CreateCampaignThreadRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Thread text is required.");
        }

        if (!IsValidThreadVisibility(request.Visibility))
        {
            return BadRequest("Thread visibility must be Party or GMOnly.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.AddThreadAsync(campaignId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign was not found.");
        }

        return Ok(updated);
    }

    [HttpPut("{campaignId:guid}/threads/{threadId:guid}")]
    public async Task<ActionResult<CampaignDto>> UpdateThread(Guid campaignId, Guid threadId, [FromBody] UpdateCampaignThreadRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return BadRequest("Thread text is required.");
        }

        if (!IsValidThreadVisibility(request.Visibility))
        {
            return BadRequest("Thread visibility must be Party or GMOnly.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.UpdateThreadAsync(campaignId, threadId, request, user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign or thread was not found.");
        }

        return Ok(updated);
    }

    [HttpPut("{campaignId:guid}/threads/{threadId:guid}/archive")]
    public async Task<ActionResult<CampaignDto>> ArchiveThread(Guid campaignId, Guid threadId, CancellationToken cancellationToken)
    {
        if (threadId == Guid.Empty)
        {
            return BadRequest("Thread id is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.ArchiveThreadAsync(campaignId, new ArchiveCampaignThreadRequest(threadId), user.Id, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign or thread was not found.");
        }

        return Ok(updated);
    }

    private static bool IsValidThreadVisibility(string? visibility)
    {
        return string.Equals(visibility, "Party", StringComparison.OrdinalIgnoreCase)
            || string.Equals(visibility, "GMOnly", StringComparison.OrdinalIgnoreCase);
    }

    [HttpPost("{campaignId:guid}/invites")]
    public async Task<ActionResult<CampaignDto>> InviteMember(Guid campaignId, [FromBody] InviteCampaignMemberRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest("Invite email is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? updated;
        try
        {
            updated = await campaignService.InviteMemberAsync(campaignId, request, user, cancellationToken);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }

        if (updated is null)
        {
            return NotFound("Campaign was not found.");
        }

        return Ok(updated);
    }

    [HttpDelete("{campaignId:guid}")]
    public async Task<IActionResult> Delete(Guid campaignId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            await campaignService.DeleteAsync(campaignId, user.Id, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException)
        {
            return NotFound("Campaign was not found.");
        }
    }

    private async Task<AuthenticatedUser?> GetAuthenticatedUserAsync(CancellationToken cancellationToken)
    {
        var authorization = Request.Headers.Authorization.ToString();
        var token = authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization[7..].Trim()
            : string.Empty;

        return await authService.GetAuthenticatedUserByTokenAsync(token, cancellationToken);
    }

    private static string BuildCampaignDraftPrompt(GenerateCampaignDraftRequest request)
    {
        var toneHint = string.IsNullOrWhiteSpace(request.Tone) ? "Any" : request.Tone.Trim();
        var settingHint = string.IsNullOrWhiteSpace(request.SettingHint) ? "No setting hint provided" : request.SettingHint.Trim();
        var direction = string.IsNullOrWhiteSpace(request.AdditionalDirection) ? "No additional direction provided" : request.AdditionalDirection.Trim();
        var requestedLevelStart = Math.Clamp(request.LevelStart ?? 1, 1, 20);
        var requestedLevelEnd = Math.Clamp(request.LevelEnd ?? 4, requestedLevelStart, 20);

        return string.Join('\n',
        [
            "Generate a Dungeons & Dragons campaign draft for DungeonKeep.",
            "Return only valid JSON with the fields: name, setting, tone, levelStart, levelEnd, hook, nextSession, summary.",
            "tone must be exactly one of: Heroic, Grim, Mystic, Chaotic, Grimdark, Gothic, Horror, Noblebright, Sword-and-Sorcery, Political Intrigue, Mythic, Survival, Pulp Adventure, Dark Fantasy, Whimsical, Noir, Epic War, Cosmic, Heroic Tragedy.",
            "levelStart and levelEnd must be integers between 1 and 20.",
            "name and setting should be concise and table-friendly.",
            "hook should be one clear inciting incident.",
            "nextSession should be a concrete first-session objective or date phrase.",
            "summary should be 1-2 sentences.",
            "Prefer a campaign scope that fits the requested level range.",
            string.Empty,
            $"Preferred tone: {toneHint}",
            $"Setting hint: {settingHint}",
            $"Requested level range: {requestedLevelStart}-{requestedLevelEnd}",
            $"Additional direction: {direction}"
        ]);
    }

    private static string NormalizeTone(string? generatedTone, string? requestedTone)
    {
        var candidate = string.IsNullOrWhiteSpace(generatedTone)
            ? requestedTone
            : generatedTone;

        if (string.IsNullOrWhiteSpace(candidate))
        {
            return "Heroic";
        }

        return candidate.Trim().ToLowerInvariant() switch
        {
            "heroic" => "Heroic",
            "grim" => "Grim",
            "mystic" => "Mystic",
            "chaotic" => "Chaotic",
            "grimdark" => "Grimdark",
            "gothic" => "Gothic",
            "horror" => "Horror",
            "noblebright" => "Noblebright",
            "sword-and-sorcery" => "Sword-and-Sorcery",
            "sword and sorcery" => "Sword-and-Sorcery",
            "political intrigue" => "Political Intrigue",
            "mythic" => "Mythic",
            "survival" => "Survival",
            "pulp adventure" => "Pulp Adventure",
            "dark fantasy" => "Dark Fantasy",
            "whimsical" => "Whimsical",
            "noir" => "Noir",
            "epic war" => "Epic War",
            "cosmic" => "Cosmic",
            "heroic tragedy" => "Heroic Tragedy",
            _ => "Heroic"
        };
    }

    private static int NormalizeLevel(int? generatedLevel, int? requestedLevel, int fallback)
    {
        return Math.Clamp(generatedLevel ?? requestedLevel ?? fallback, 1, 20);
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

    private static GenerateCampaignDraftPayload? TryParseGeneratedCampaignDraftPayload(string rawText)
    {
        foreach (var candidate in BuildJsonCandidates(rawText))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<GenerateCampaignDraftPayload>(candidate, SerializerOptions);
                if (parsed is not null)
                {
                    return parsed;
                }
            }
            catch (JsonException)
            {
            }
        }

        return null;
    }

    private static IEnumerable<string> BuildJsonCandidates(string rawText)
    {
        if (string.IsNullOrWhiteSpace(rawText))
        {
            yield break;
        }

        var trimmed = rawText.Trim();
        yield return trimmed;

        var withoutFences = StripMarkdownCodeFences(trimmed);
        if (!string.Equals(withoutFences, trimmed, StringComparison.Ordinal))
        {
            yield return withoutFences;
        }

        var fromRawObject = ExtractFirstJsonObject(trimmed);
        if (fromRawObject is not null)
        {
            yield return fromRawObject;
        }

        var fromFenceObject = ExtractFirstJsonObject(withoutFences);
        if (fromFenceObject is not null && !string.Equals(fromFenceObject, fromRawObject, StringComparison.Ordinal))
        {
            yield return fromFenceObject;
        }
    }

    private static string StripMarkdownCodeFences(string text)
    {
        var lines = text.Split('\n');
        var builder = new StringBuilder();

        foreach (var line in lines)
        {
            var trimmedLine = line.Trim();
            if (trimmedLine.StartsWith("```", StringComparison.Ordinal))
            {
                continue;
            }

            builder.AppendLine(line);
        }

        return builder.ToString().Trim();
    }

    private static string? ExtractFirstJsonObject(string text)
    {
        var start = text.IndexOf('{');
        if (start < 0)
        {
            return null;
        }

        var depth = 0;
        var inString = false;
        var escape = false;

        for (var i = start; i < text.Length; i++)
        {
            var ch = text[i];

            if (escape)
            {
                escape = false;
                continue;
            }

            if (ch == '\\')
            {
                escape = true;
                continue;
            }

            if (ch == '"')
            {
                inString = !inString;
                continue;
            }

            if (inString)
            {
                continue;
            }

            if (ch == '{')
            {
                depth++;
            }
            else if (ch == '}')
            {
                depth--;
                if (depth == 0)
                {
                    return text[start..(i + 1)];
                }
            }
        }

        return null;
    }

    public sealed record GenerateCampaignDraftRequest(string Tone, string SettingHint, string AdditionalDirection, int? LevelStart, int? LevelEnd);

    public sealed record GenerateCampaignDraftResponse(string Name, string Setting, string Tone, int LevelStart, int LevelEnd, string Hook, string NextSession, string Summary);

    private sealed record GenerateCampaignDraftPayload(string Name, string Setting, string Tone, int? LevelStart, int? LevelEnd, string Hook, string NextSession, string Summary);

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
