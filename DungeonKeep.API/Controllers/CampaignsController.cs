using DungeonKeep.API.Hubs;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Primitives;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class CampaignsController(ICampaignService campaignService, ICharacterService characterService, IAuthService authService, IHttpClientFactory httpClientFactory, IConfiguration configuration, IHubContext<CampaignHub> campaignHub) : ControllerBase
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

        await campaignHub.Clients
            .Group($"campaign-{campaignId}")
            .SendAsync("PartyCurrencyUpdated", new { campaignId = campaignId.ToString(), updated.Summary }, cancellationToken);

        return Ok(updated);
    }

    [HttpPost("{campaignId:guid}/sessions")]
    public async Task<ActionResult<CampaignDto>> CreateSession(Guid campaignId, [FromBody] CreateCampaignSessionRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Session title is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.AddSessionAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPut("{campaignId:guid}/sessions/{sessionId:guid}")]
    public async Task<ActionResult<CampaignDto>> UpdateSession(Guid campaignId, Guid sessionId, [FromBody] UpdateCampaignSessionRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("Session title is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.UpdateSessionAsync(campaignId, sessionId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or session was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/sessions/{sessionId:guid}/delete")]
    public async Task<ActionResult<CampaignDto>> DeleteSession(Guid campaignId, Guid sessionId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.RemoveSessionAsync(campaignId, sessionId, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or session was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/sessions/generate-draft")]
    public async Task<ActionResult<GenerateSessionDraftResponse>> GenerateSessionDraft(Guid campaignId, [FromBody] GenerateSessionDraftRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var campaign = await GetCampaignContextAsync(campaignId, user.Id, cancellationToken);
        if (campaign is null)
        {
            return NotFound("Campaign was not found.");
        }

        if (!string.Equals(campaign.CurrentUserRole, "Owner", StringComparison.OrdinalIgnoreCase))
        {
            return StatusCode(403);
        }

        if (!TryGetOpenAiConfiguration(out var apiKey, out var responsesUrl, out var model))
        {
            return Problem(title: "Session generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            var text = await SendOpenAiPromptAsync(
                apiKey,
                responsesUrl,
                model,
                BuildSessionDraftPrompt(campaign, request),
                temperature: 0.9,
                maxOutputTokens: 2200,
                cancellationToken);

            var generated = TryParseGeneratedSessionDraftPayload(text);
            if (generated is null)
            {
                var repairedText = await RepairJsonAsync(
                    apiKey,
                    responsesUrl,
                    model,
                    BuildSessionDraftRepairPrompt(text),
                    maxOutputTokens: 2600,
                    cancellationToken);

                generated = TryParseGeneratedSessionDraftPayload(repairedText);
            }

            if (generated is null)
            {
                return Problem(title: "Session generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeSessionDraft(generated, campaign));
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Session generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Session generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPost("{campaignId:guid}/npcs")]
    public async Task<ActionResult<CampaignDto>> AddNpc(Guid campaignId, [FromBody] CreateCampaignNpcRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("NPC name is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.AddNpcAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("npcs/generate-draft")]
    public async Task<ActionResult<GenerateNpcDraftResponse>> GenerateNpcDraft([FromBody] GenerateNpcDraftRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        CampaignDto? campaign = null;
        if (request.CampaignId is Guid campaignId && campaignId != Guid.Empty)
        {
            campaign = await GetCampaignContextAsync(campaignId, user.Id, cancellationToken);
            if (campaign is null)
            {
                return NotFound("Campaign was not found.");
            }

            if (!string.Equals(campaign.CurrentUserRole, "Owner", StringComparison.OrdinalIgnoreCase))
            {
                return StatusCode(403);
            }
        }

        if (!TryGetOpenAiConfiguration(out var apiKey, out var responsesUrl, out var model))
        {
            return Problem(title: "NPC generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            var text = await SendOpenAiPromptAsync(
                apiKey,
                responsesUrl,
                model,
                BuildNpcDraftPrompt(campaign, request),
                temperature: 0.95,
                maxOutputTokens: 1800,
                cancellationToken);

            var generated = TryParseGeneratedNpcDraftPayload(text);
            if (generated is null)
            {
                var repairedText = await RepairJsonAsync(
                    apiKey,
                    responsesUrl,
                    model,
                    BuildNpcDraftRepairPrompt(text),
                    maxOutputTokens: 2200,
                    cancellationToken);

                generated = TryParseGeneratedNpcDraftPayload(repairedText);
            }

            if (generated is null)
            {
                return Problem(title: "NPC generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeNpcDraft(generated));
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "NPC generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "NPC generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPost("{campaignId:guid}/npcs/remove")]
    public async Task<ActionResult<CampaignDto>> RemoveNpc(Guid campaignId, [FromBody] RemoveCampaignNpcRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("NPC name is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.RemoveNpcAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or NPC was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/loot")]
    public async Task<ActionResult<CampaignDto>> AddLoot(Guid campaignId, [FromBody] CreateCampaignLootRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Loot name is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.AddLootAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/loot/remove")]
    public async Task<ActionResult<CampaignDto>> RemoveLoot(Guid campaignId, [FromBody] RemoveCampaignLootRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Loot name is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.RemoveLootAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or loot was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
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
            var repairedText = await RepairJsonAsync(
                apiKey,
                responsesUrl,
                model,
                BuildCampaignDraftRepairPrompt(text),
                maxOutputTokens: 900,
                cancellationToken);

            generated = TryParseGeneratedCampaignDraftPayload(repairedText);
        }

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
            updated = await campaignService.InviteMemberAsync(campaignId, request, user, GetClientBaseUrl(), cancellationToken);
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

    private string? GetClientBaseUrl()
    {
        if (TryGetAbsoluteHttpUrl(Request.Headers.Origin, out var originBaseUrl))
        {
            return originBaseUrl;
        }

        if (TryGetAbsoluteHttpUrl(Request.Headers.Referer, out var refererBaseUrl))
        {
            return refererBaseUrl;
        }

        return null;
    }

    private static bool TryGetAbsoluteHttpUrl(StringValues headerValues, out string? baseUrl)
    {
        baseUrl = null;
        var candidate = headerValues.FirstOrDefault();

        if (!Uri.TryCreate(candidate, UriKind.Absolute, out var uri))
        {
            return false;
        }

        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase)
            && !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        baseUrl = uri.GetLeftPart(UriPartial.Authority);
        return true;
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

    [HttpPost("{campaignId:guid}/leave")]
    public async Task<IActionResult> Leave(Guid campaignId, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            await campaignService.LeaveAsync(campaignId, user.Id, cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
        catch (InvalidOperationException exception)
        {
            if (string.Equals(exception.Message, "Campaign owners cannot leave their own campaign.", StringComparison.Ordinal))
            {
                return BadRequest(exception.Message);
            }

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

    private async Task<CampaignDto?> GetCampaignContextAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken)
    {
        var campaigns = await campaignService.GetAllAsync(userId, cancellationToken);
        return campaigns.FirstOrDefault(campaign => campaign.Id == campaignId);
    }

    private bool TryGetOpenAiConfiguration(out string apiKey, out string responsesUrl, out string model)
    {
        apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"] ?? string.Empty;
        responsesUrl = configuration["OpenAI:ResponsesUrl"] ?? DefaultResponsesUrl;
        model = configuration["OpenAI:Model"] ?? DefaultModel;

        return !string.IsNullOrWhiteSpace(apiKey);
    }

    private async Task<string> SendOpenAiPromptAsync(
        string apiKey,
        string responsesUrl,
        string model,
        string prompt,
        double temperature,
        int maxOutputTokens,
        CancellationToken cancellationToken)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, responsesUrl)
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim())
            },
            Content = JsonContent.Create(new
            {
                model,
                temperature,
                max_output_tokens = maxOutputTokens,
                input = prompt
            })
        };

        var client = httpClientFactory.CreateClient();
        using var response = await client.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            throw new HttpRequestException($"OpenAI request failed ({(int)response.StatusCode}): {detail}", null, response.StatusCode);
        }

        var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
        var text = ExtractResponseText(payload);
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("The model returned no text.");
        }

        return text;
    }

    private async Task<string> RepairJsonAsync(
        string apiKey,
        string responsesUrl,
        string model,
        string repairPrompt,
        int maxOutputTokens,
        CancellationToken cancellationToken)
    {
        return await SendOpenAiPromptAsync(
            apiKey,
            responsesUrl,
            model,
            repairPrompt,
            temperature: 0.1,
            maxOutputTokens,
            cancellationToken);
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

    private static string BuildCampaignDraftRepairPrompt(string invalidOutput)
    {
        return string.Join('\n',
        [
            "Convert the provided campaign draft content into valid JSON only.",
            "Do not add markdown, explanations, or code fences.",
            "Use exactly these top-level fields: name, setting, tone, levelStart, levelEnd, hook, nextSession, summary.",
            "levelStart and levelEnd must be integers.",
            string.Empty,
            "Content to repair:",
            invalidOutput
        ]);
    }

    private static string BuildSessionDraftPrompt(CampaignDto campaign, GenerateSessionDraftRequest request)
    {
        var titleHint = string.IsNullOrWhiteSpace(request.TitleHint) ? "No title hint provided" : request.TitleHint.Trim();
        var shortDescriptionHint = string.IsNullOrWhiteSpace(request.ShortDescriptionHint) ? "No objective hint provided" : request.ShortDescriptionHint.Trim();
        var locationHint = string.IsNullOrWhiteSpace(request.LocationHint) ? "No location hint provided" : request.LocationHint.Trim();
        var estimatedLengthHint = string.IsNullOrWhiteSpace(request.EstimatedLengthHint) ? "No pacing hint provided" : request.EstimatedLengthHint.Trim();
        var markdownNotesHint = string.IsNullOrWhiteSpace(request.MarkdownNotesHint) ? "No extra notes provided" : request.MarkdownNotesHint.Trim();

        return string.Join('\n',
        [
            "Generate a Dungeons & Dragons session planning draft for DungeonKeep.",
            "Return only valid JSON.",
            "Use these exact top-level fields: title, shortDescription, date, inGameLocation, estimatedLength, markdownNotes, scenes, npcs, monsters, locations, loot, skillChecks, secrets, branchingPaths, nextSessionHooks.",
            "scenes must be an array of objects with: title, description, trigger, keyEvents, possibleOutcomes.",
            "npcs must be an array of objects with: name, role, personality, motivation, voiceNotes.",
            "monsters must be an array of objects with: name, type, challengeRating, hp, keyAbilities, notes.",
            "locations must be an array of objects with: name, description, secrets, encounters.",
            "loot must be an array of objects with: name, type, quantity, notes.",
            "skillChecks must be an array of objects with: situation, skill, dc, successOutcome, failureOutcome.",
            "secrets, branchingPaths, and nextSessionHooks must be arrays of concise strings.",
            "Keep the session practical for a DM to run at the table.",
            "Ground the material in the existing campaign context and avoid contradicting it.",
            string.Empty,
            $"Campaign name: {campaign.Name}",
            $"Campaign setting: {campaign.Setting}",
            $"Campaign tone: {campaign.Tone}",
            $"Campaign hook: {campaign.Hook}",
            $"Next session note: {campaign.NextSession}",
            $"Campaign summary: {campaign.Summary}",
            $"Known NPC names: {FormatList(campaign.Npcs)}",
            $"Known loot: {FormatList(campaign.Loot)}",
            $"Open threads: {FormatList(campaign.OpenThreads.Select(thread => thread.Text))}",
            $"Recent sessions: {FormatList(campaign.Sessions.TakeLast(3).Select(session => $"{session.Title} ({session.Location})"))}",
            string.Empty,
            $"Title hint: {titleHint}",
            $"Objective hint: {shortDescriptionHint}",
            $"Location hint: {locationHint}",
            $"Pacing hint: {estimatedLengthHint}",
            $"Current notes hint: {markdownNotesHint}"
        ]);
    }

    private static string BuildSessionDraftRepairPrompt(string invalidOutput)
    {
        return string.Join('\n',
        [
            "Convert the provided session draft content into valid JSON only.",
            "Do not add markdown, explanations, or code fences.",
            "Use these exact top-level fields: title, shortDescription, date, inGameLocation, estimatedLength, markdownNotes, scenes, npcs, monsters, locations, loot, skillChecks, secrets, branchingPaths, nextSessionHooks.",
            "scenes must be an array of objects with: title, description, trigger, keyEvents, possibleOutcomes.",
            "npcs must be an array of objects with: name, role, personality, motivation, voiceNotes.",
            "monsters must be an array of objects with: name, type, challengeRating, hp, keyAbilities, notes.",
            "locations must be an array of objects with: name, description, secrets, encounters.",
            "loot must be an array of objects with: name, type, quantity, notes.",
            "skillChecks must be an array of objects with: situation, skill, dc, successOutcome, failureOutcome.",
            "secrets, branchingPaths, and nextSessionHooks must be arrays of strings.",
            string.Empty,
            "Content to repair:",
            invalidOutput
        ]);
    }

    private static string BuildNpcDraftPrompt(CampaignDto? campaign, GenerateNpcDraftRequest request)
    {
        var nameHint = string.IsNullOrWhiteSpace(request.NameHint) ? "No name hint provided" : request.NameHint.Trim();
        var titleHint = string.IsNullOrWhiteSpace(request.TitleHint) ? "No title hint provided" : request.TitleHint.Trim();
        var raceHint = string.IsNullOrWhiteSpace(request.RaceHint) ? "No race hint provided" : request.RaceHint.Trim();
        var roleHint = string.IsNullOrWhiteSpace(request.RoleHint) ? "No role hint provided" : request.RoleHint.Trim();
        var factionHint = string.IsNullOrWhiteSpace(request.FactionHint) ? "No faction hint provided" : request.FactionHint.Trim();
        var locationHint = string.IsNullOrWhiteSpace(request.LocationHint) ? "No location hint provided" : request.LocationHint.Trim();
        var motivationHint = string.IsNullOrWhiteSpace(request.MotivationHint) ? "No motivation hint provided" : request.MotivationHint.Trim();
        var notesHint = string.IsNullOrWhiteSpace(request.NotesHint) ? "No extra notes provided" : request.NotesHint.Trim();

        var lines = new List<string>
        {
            "Generate a Dungeons & Dragons NPC draft for DungeonKeep.",
            "Return only valid JSON.",
            "Use these exact fields: name, title, race, classOrRole, faction, occupation, age, gender, alignment, currentStatus, location, shortDescription, appearance, personalityTraits, ideals, bonds, flaws, motivations, goals, fears, secrets, mannerisms, voiceNotes, backstory, notes, combatNotes, statBlockReference, tags, questLinks, sessionAppearances, inventory, imageUrl, isHostile, isAlive, isImportant.",
            "personalityTraits, ideals, bonds, flaws, secrets, mannerisms, tags, questLinks, sessionAppearances, and inventory must be arrays of concise strings.",
            "Keep the NPC useful at the table and grounded in the provided campaign context when one exists.",
            string.Empty
        };

        if (campaign is not null)
        {
            lines.Add($"Campaign name: {campaign.Name}");
            lines.Add($"Campaign setting: {campaign.Setting}");
            lines.Add($"Campaign tone: {campaign.Tone}");
            lines.Add($"Campaign summary: {campaign.Summary}");
            lines.Add($"Campaign hook: {campaign.Hook}");
            lines.Add($"Existing NPC names to avoid duplicating: {FormatList(request.ExistingNpcNames)}");
            lines.Add($"Open threads: {FormatList(campaign.OpenThreads.Select(thread => thread.Text))}");
            lines.Add(string.Empty);
        }
        else
        {
            lines.Add($"Existing NPC names to avoid duplicating: {FormatList(request.ExistingNpcNames)}");
            lines.Add("No campaign context was provided, so generate a reusable fantasy NPC that can fit into multiple adventures.");
            lines.Add(string.Empty);
        }

        lines.Add($"Name hint: {nameHint}");
        lines.Add($"Title hint: {titleHint}");
        lines.Add($"Race hint: {raceHint}");
        lines.Add($"Role hint: {roleHint}");
        lines.Add($"Faction hint: {factionHint}");
        lines.Add($"Location hint: {locationHint}");
        lines.Add($"Motivation hint: {motivationHint}");
        lines.Add($"Additional notes hint: {notesHint}");

        return string.Join('\n', lines);
    }

    private static string BuildNpcDraftRepairPrompt(string invalidOutput)
    {
        return string.Join('\n',
        [
            "Convert the provided NPC draft content into valid JSON only.",
            "Do not add markdown, explanations, or code fences.",
            "Use these exact fields: name, title, race, classOrRole, faction, occupation, age, gender, alignment, currentStatus, location, shortDescription, appearance, personalityTraits, ideals, bonds, flaws, motivations, goals, fears, secrets, mannerisms, voiceNotes, backstory, notes, combatNotes, statBlockReference, tags, questLinks, sessionAppearances, inventory, imageUrl, isHostile, isAlive, isImportant.",
            "personalityTraits, ideals, bonds, flaws, secrets, mannerisms, tags, questLinks, sessionAppearances, and inventory must be arrays of strings.",
            "isHostile, isAlive, and isImportant must be booleans.",
            string.Empty,
            "Content to repair:",
            invalidOutput
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

    private static GenerateSessionDraftResponse NormalizeSessionDraft(GenerateSessionDraftPayload generated, CampaignDto campaign)
    {
        var sessionNumber = campaign.Sessions.Count + 1;

        return new GenerateSessionDraftResponse(
            Title: string.IsNullOrWhiteSpace(generated.Title) ? $"Session {sessionNumber}" : generated.Title.Trim(),
            ShortDescription: string.IsNullOrWhiteSpace(generated.ShortDescription) ? campaign.NextSession.Trim() : generated.ShortDescription.Trim(),
            Date: string.IsNullOrWhiteSpace(generated.Date) ? string.Empty : generated.Date.Trim(),
            InGameLocation: string.IsNullOrWhiteSpace(generated.InGameLocation) ? campaign.Setting.Trim() : generated.InGameLocation.Trim(),
            EstimatedLength: string.IsNullOrWhiteSpace(generated.EstimatedLength) ? "3-4 hours" : generated.EstimatedLength.Trim(),
            MarkdownNotes: string.IsNullOrWhiteSpace(generated.MarkdownNotes) ? "## Session Notes\n- Generated draft ready for review." : generated.MarkdownNotes.Trim(),
            Scenes: (generated.Scenes ?? []).Take(8).Select(scene => new GenerateSessionSceneResponse(
                Title: CleanText(scene.Title),
                Description: CleanText(scene.Description),
                Trigger: CleanText(scene.Trigger),
                KeyEvents: NormalizeStringList(scene.KeyEvents, 6),
                PossibleOutcomes: NormalizeStringList(scene.PossibleOutcomes, 6)
            )).Where(scene => !string.IsNullOrWhiteSpace(scene.Title) || !string.IsNullOrWhiteSpace(scene.Description)).ToArray(),
            Npcs: (generated.Npcs ?? []).Take(8).Select(npc => new GenerateSessionNpcResponse(
                Name: CleanText(npc.Name),
                Role: CleanText(npc.Role),
                Personality: CleanText(npc.Personality),
                Motivation: CleanText(npc.Motivation),
                VoiceNotes: CleanText(npc.VoiceNotes)
            )).Where(npc => !string.IsNullOrWhiteSpace(npc.Name)).ToArray(),
            Monsters: (generated.Monsters ?? []).Take(8).Select(monster => new GenerateSessionMonsterResponse(
                Name: CleanText(monster.Name),
                Type: CleanText(monster.Type),
                ChallengeRating: CleanText(monster.ChallengeRating),
                Hp: Math.Max(0, monster.Hp ?? 0),
                KeyAbilities: CleanText(monster.KeyAbilities),
                Notes: CleanText(monster.Notes)
            )).Where(monster => !string.IsNullOrWhiteSpace(monster.Name)).ToArray(),
            Locations: (generated.Locations ?? []).Take(8).Select(location => new GenerateSessionLocationResponse(
                Name: CleanText(location.Name),
                Description: CleanText(location.Description),
                Secrets: CleanText(location.Secrets),
                Encounters: CleanText(location.Encounters)
            )).Where(location => !string.IsNullOrWhiteSpace(location.Name)).ToArray(),
            Loot: (generated.Loot ?? []).Take(8).Select(loot => new GenerateSessionLootItemResponse(
                Name: CleanText(loot.Name),
                Type: CleanText(loot.Type),
                Quantity: Math.Max(1, loot.Quantity ?? 1),
                Notes: CleanText(loot.Notes)
            )).Where(loot => !string.IsNullOrWhiteSpace(loot.Name)).ToArray(),
            SkillChecks: (generated.SkillChecks ?? []).Take(8).Select(skillCheck => new GenerateSessionSkillCheckResponse(
                Situation: CleanText(skillCheck.Situation),
                Skill: CleanText(skillCheck.Skill),
                Dc: Math.Clamp(skillCheck.Dc ?? 10, 1, 30),
                SuccessOutcome: CleanText(skillCheck.SuccessOutcome),
                FailureOutcome: CleanText(skillCheck.FailureOutcome)
            )).Where(skillCheck => !string.IsNullOrWhiteSpace(skillCheck.Situation)).ToArray(),
            Secrets: NormalizeStringList(generated.Secrets, 8),
            BranchingPaths: NormalizeStringList(generated.BranchingPaths, 8),
            NextSessionHooks: NormalizeStringList(generated.NextSessionHooks, 8)
        );
    }

    private static GenerateNpcDraftResponse NormalizeNpcDraft(GenerateNpcDraftPayload generated)
    {
        return new GenerateNpcDraftResponse(
            Name: string.IsNullOrWhiteSpace(generated.Name) ? "Generated NPC" : generated.Name.Trim(),
            Title: CleanText(generated.Title),
            Race: CleanText(generated.Race),
            ClassOrRole: CleanText(generated.ClassOrRole),
            Faction: CleanText(generated.Faction),
            Occupation: CleanText(generated.Occupation),
            Age: CleanText(generated.Age),
            Gender: CleanText(generated.Gender),
            Alignment: CleanText(generated.Alignment),
            CurrentStatus: CleanText(generated.CurrentStatus),
            Location: CleanText(generated.Location),
            ShortDescription: CleanText(generated.ShortDescription),
            Appearance: CleanText(generated.Appearance),
            PersonalityTraits: NormalizeStringList(generated.PersonalityTraits, 6),
            Ideals: NormalizeStringList(generated.Ideals, 4),
            Bonds: NormalizeStringList(generated.Bonds, 4),
            Flaws: NormalizeStringList(generated.Flaws, 4),
            Motivations: CleanText(generated.Motivations),
            Goals: CleanText(generated.Goals),
            Fears: CleanText(generated.Fears),
            Secrets: NormalizeStringList(generated.Secrets, 6),
            Mannerisms: NormalizeStringList(generated.Mannerisms, 6),
            VoiceNotes: CleanText(generated.VoiceNotes),
            Backstory: CleanText(generated.Backstory),
            Notes: CleanText(generated.Notes),
            CombatNotes: CleanText(generated.CombatNotes),
            StatBlockReference: CleanText(generated.StatBlockReference),
            Tags: NormalizeStringList(generated.Tags, 8),
            QuestLinks: NormalizeStringList(generated.QuestLinks, 6),
            SessionAppearances: NormalizeStringList(generated.SessionAppearances, 6),
            Inventory: NormalizeStringList(generated.Inventory, 8),
            ImageUrl: CleanText(generated.ImageUrl),
            IsHostile: generated.IsHostile ?? false,
            IsAlive: generated.IsAlive ?? true,
            IsImportant: generated.IsImportant ?? false
        );
    }

    private static string CleanText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static string FormatList(IEnumerable<string>? values)
    {
        var entries = values?
            .Select(value => value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Cast<string>()
            .Take(10)
            .ToArray();

        return entries is { Length: > 0 } ? string.Join(", ", entries) : "None recorded";
    }

    private static string[] NormalizeStringList(IEnumerable<string?>? values, int maxItems)
    {
        return values?
            .Select(value => value?.Trim())
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(maxItems)
            .ToArray()
            ?? [];
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

    private static GenerateSessionDraftPayload? TryParseGeneratedSessionDraftPayload(string rawText)
    {
        foreach (var candidate in BuildJsonCandidates(rawText))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<GenerateSessionDraftPayload>(candidate, SerializerOptions);
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

    private static GenerateNpcDraftPayload? TryParseGeneratedNpcDraftPayload(string rawText)
    {
        foreach (var candidate in BuildJsonCandidates(rawText))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<GenerateNpcDraftPayload>(candidate, SerializerOptions);
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

        var decodedString = TryDecodeJsonString(trimmed);
        if (!string.IsNullOrWhiteSpace(decodedString))
        {
            var decodedTrimmed = decodedString.Trim();
            if (!string.Equals(decodedTrimmed, trimmed, StringComparison.Ordinal))
            {
                yield return decodedTrimmed;
            }

            var decodedWithoutFences = StripMarkdownCodeFences(decodedTrimmed);
            if (!string.Equals(decodedWithoutFences, decodedTrimmed, StringComparison.Ordinal))
            {
                yield return decodedWithoutFences;
            }

            var fromDecodedObject = ExtractFirstJsonObject(decodedTrimmed);
            if (fromDecodedObject is not null)
            {
                yield return fromDecodedObject;
            }
        }
    }

    private static string? TryDecodeJsonString(string text)
    {
        try
        {
            return JsonSerializer.Deserialize<string>(text, SerializerOptions);
        }
        catch (JsonException)
        {
            return null;
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

    public sealed record GenerateSessionDraftRequest(string? TitleHint, string? ShortDescriptionHint, string? LocationHint, string? EstimatedLengthHint, string? MarkdownNotesHint);

    public sealed record GenerateSessionDraftResponse(
        string Title,
        string ShortDescription,
        string Date,
        string InGameLocation,
        string EstimatedLength,
        string MarkdownNotes,
        IReadOnlyList<GenerateSessionSceneResponse> Scenes,
        IReadOnlyList<GenerateSessionNpcResponse> Npcs,
        IReadOnlyList<GenerateSessionMonsterResponse> Monsters,
        IReadOnlyList<GenerateSessionLocationResponse> Locations,
        IReadOnlyList<GenerateSessionLootItemResponse> Loot,
        IReadOnlyList<GenerateSessionSkillCheckResponse> SkillChecks,
        IReadOnlyList<string> Secrets,
        IReadOnlyList<string> BranchingPaths,
        IReadOnlyList<string> NextSessionHooks);

    public sealed record GenerateNpcDraftRequest(
        Guid? CampaignId,
        string? NameHint,
        string? TitleHint,
        string? RaceHint,
        string? RoleHint,
        string? FactionHint,
        string? LocationHint,
        string? MotivationHint,
        string? NotesHint,
        IReadOnlyList<string>? ExistingNpcNames);

    public sealed record GenerateNpcDraftResponse(
        string Name,
        string Title,
        string Race,
        string ClassOrRole,
        string Faction,
        string Occupation,
        string Age,
        string Gender,
        string Alignment,
        string CurrentStatus,
        string Location,
        string ShortDescription,
        string Appearance,
        IReadOnlyList<string> PersonalityTraits,
        IReadOnlyList<string> Ideals,
        IReadOnlyList<string> Bonds,
        IReadOnlyList<string> Flaws,
        string Motivations,
        string Goals,
        string Fears,
        IReadOnlyList<string> Secrets,
        IReadOnlyList<string> Mannerisms,
        string VoiceNotes,
        string Backstory,
        string Notes,
        string CombatNotes,
        string StatBlockReference,
        IReadOnlyList<string> Tags,
        IReadOnlyList<string> QuestLinks,
        IReadOnlyList<string> SessionAppearances,
        IReadOnlyList<string> Inventory,
        string ImageUrl,
        bool IsHostile,
        bool IsAlive,
        bool IsImportant);

    public sealed record GenerateSessionSceneResponse(string Title, string Description, string Trigger, IReadOnlyList<string> KeyEvents, IReadOnlyList<string> PossibleOutcomes);
    public sealed record GenerateSessionNpcResponse(string Name, string Role, string Personality, string Motivation, string VoiceNotes);
    public sealed record GenerateSessionMonsterResponse(string Name, string Type, string ChallengeRating, int Hp, string KeyAbilities, string Notes);
    public sealed record GenerateSessionLocationResponse(string Name, string Description, string Secrets, string Encounters);
    public sealed record GenerateSessionLootItemResponse(string Name, string Type, int Quantity, string Notes);
    public sealed record GenerateSessionSkillCheckResponse(string Situation, string Skill, int Dc, string SuccessOutcome, string FailureOutcome);

    private sealed record GenerateCampaignDraftPayload(string Name, string Setting, string Tone, int? LevelStart, int? LevelEnd, string Hook, string NextSession, string Summary);

    private sealed record GenerateSessionDraftPayload(
        string? Title,
        string? ShortDescription,
        string? Date,
        string? InGameLocation,
        string? EstimatedLength,
        string? MarkdownNotes,
        List<GenerateSessionScenePayload>? Scenes,
        List<GenerateSessionNpcPayload>? Npcs,
        List<GenerateSessionMonsterPayload>? Monsters,
        List<GenerateSessionLocationPayload>? Locations,
        List<GenerateSessionLootItemPayload>? Loot,
        List<GenerateSessionSkillCheckPayload>? SkillChecks,
        List<string>? Secrets,
        List<string>? BranchingPaths,
        List<string>? NextSessionHooks);

    private sealed record GenerateNpcDraftPayload(
        string? Name,
        string? Title,
        string? Race,
        string? ClassOrRole,
        string? Faction,
        string? Occupation,
        string? Age,
        string? Gender,
        string? Alignment,
        string? CurrentStatus,
        string? Location,
        string? ShortDescription,
        string? Appearance,
        List<string>? PersonalityTraits,
        List<string>? Ideals,
        List<string>? Bonds,
        List<string>? Flaws,
        string? Motivations,
        string? Goals,
        string? Fears,
        List<string>? Secrets,
        List<string>? Mannerisms,
        string? VoiceNotes,
        string? Backstory,
        string? Notes,
        string? CombatNotes,
        string? StatBlockReference,
        List<string>? Tags,
        List<string>? QuestLinks,
        List<string>? SessionAppearances,
        List<string>? Inventory,
        string? ImageUrl,
        bool? IsHostile,
        bool? IsAlive,
        bool? IsImportant);

    private sealed record GenerateSessionScenePayload(string? Title, string? Description, string? Trigger, List<string>? KeyEvents, List<string>? PossibleOutcomes);
    private sealed record GenerateSessionNpcPayload(string? Name, string? Role, string? Personality, string? Motivation, string? VoiceNotes);
    private sealed record GenerateSessionMonsterPayload(string? Name, string? Type, string? ChallengeRating, int? Hp, string? KeyAbilities, string? Notes);
    private sealed record GenerateSessionLocationPayload(string? Name, string? Description, string? Secrets, string? Encounters);
    private sealed record GenerateSessionLootItemPayload(string? Name, string? Type, int? Quantity, string? Notes);
    private sealed record GenerateSessionSkillCheckPayload(string? Situation, string? Skill, int? Dc, string? SuccessOutcome, string? FailureOutcome);

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
