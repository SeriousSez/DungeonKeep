using DungeonKeep.API.Hubs;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.EntityFrameworkCore;
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
public sealed class CampaignsController(ICampaignService campaignService, ICharacterService characterService, IAuthService authService, IHttpClientFactory httpClientFactory, IConfiguration configuration, IHubContext<CampaignHub> campaignHub, ILogger<CampaignsController> logger) : ControllerBase
{
    private const string DefaultModel = "gpt-4.1-mini";
    private const string DefaultResponsesUrl = "https://api.openai.com/v1/responses";
    private const string DefaultImageModel = "gpt-image-1";
    private const string DefaultImagesUrl = "https://api.openai.com/v1/images/generations";
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

        try
        {
            var created = await campaignService.CreateAsync(request, user, cancellationToken);
            return CreatedAtAction(nameof(GetAll), new { id = created.Id }, created);
        }
        catch (DbUpdateException exception)
        {
            logger.LogError(exception, "Campaign creation failed for user {UserId}", user.Id);
            return Problem(title: "Campaign creation failed.", detail: DescribeCreateFailure(exception), statusCode: StatusCodes.Status500InternalServerError);
        }
        catch (InvalidOperationException exception)
        {
            logger.LogError(exception, "Campaign creation failed for user {UserId}", user.Id);
            return Problem(title: "Campaign creation failed.", detail: DescribeCreateFailure(exception), statusCode: StatusCodes.Status500InternalServerError);
        }
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
                referenceImageUrl: null,
                temperature: 0.9,
                maxOutputTokens: 4200,
                textFormat: BuildSessionDraftJsonSchemaFormat(),
                fallbackToPlainTextOnBadRequest: true,
                cancellationToken: cancellationToken);

            var generated = TryParseGeneratedSessionDraftPayload(text);
            if (generated is null)
            {
                var repairedText = await RepairJsonAsync(
                    apiKey,
                    responsesUrl,
                    model,
                    BuildSessionDraftRepairPrompt(text),
                    maxOutputTokens: 4600,
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
                referenceImageUrl: null,
                temperature: 0.65,
                maxOutputTokens: 1800,
                textFormat: null,
                fallbackToPlainTextOnBadRequest: false,
                cancellationToken: cancellationToken);

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

            return Ok(NormalizeNpcDraft(generated, request));
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

    [HttpPost("{campaignId:guid}/world-notes")]
    public async Task<ActionResult<CampaignDto>> CreateWorldNote(Guid campaignId, [FromBody] CreateCampaignWorldNoteRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("World note title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("World note content is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.AddWorldNoteAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPut("{campaignId:guid}/world-notes/{noteId:guid}")]
    public async Task<ActionResult<CampaignDto>> UpdateWorldNote(Guid campaignId, Guid noteId, [FromBody] UpdateCampaignWorldNoteRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("World note title is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest("World note content is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.UpdateWorldNoteAsync(campaignId, noteId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or world note was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/world-notes/{noteId:guid}/delete")]
    public async Task<ActionResult<CampaignDto>> DeleteWorldNote(Guid campaignId, Guid noteId, CancellationToken cancellationToken)
    {
        if (noteId == Guid.Empty)
        {
            return BadRequest("World note id is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.DeleteWorldNoteAsync(campaignId, new DeleteCampaignWorldNoteRequest(noteId), user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign or world note was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPut("{campaignId:guid}/map")]
    public async Task<ActionResult<CampaignDto>> UpdateMap(Guid campaignId, [FromBody] UpdateCampaignMapRequest request, CancellationToken cancellationToken)
    {
        if (request.Map is null && request.Library is null)
        {
            return BadRequest("Campaign map is required.");
        }

        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var updated = await campaignService.UpdateMapAsync(campaignId, request, user.Id, cancellationToken);
            return updated is null ? NotFound("Campaign was not found.") : Ok(updated);
        }
        catch (UnauthorizedAccessException)
        {
            return StatusCode(403);
        }
    }

    [HttpPost("{campaignId:guid}/map/generate-ai")]
    public async Task<ActionResult<CampaignMapDto>> GenerateMap(Guid campaignId, [FromBody] GenerateCampaignMapRequest request, CancellationToken cancellationToken)
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
            return Problem(title: "Map generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            var text = await SendOpenAiPromptAsync(
                apiKey,
                responsesUrl,
                model,
                BuildCampaignMapPrompt(campaign, request),
                request.ReferenceImageUrl,
                temperature: 0.85,
                maxOutputTokens: 5200,
                textFormat: BuildCampaignMapJsonSchemaFormat(),
                fallbackToPlainTextOnBadRequest: true,
                cancellationToken: cancellationToken);

            var generated = TryParseGeneratedCampaignMapPayload(text);
            if (generated is null)
            {
                var repairedText = await RepairJsonAsync(
                    apiKey,
                    responsesUrl,
                    model,
                    BuildCampaignMapRepairPrompt(text),
                    maxOutputTokens: 5400,
                    cancellationToken);

                generated = TryParseGeneratedCampaignMapPayload(repairedText);
            }

            if (generated is null)
            {
                return Problem(title: "Map generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeGeneratedCampaignMap(generated, request));
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Map generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Map generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPost("{campaignId:guid}/map/generate-ai-art")]
    public async Task<ActionResult<GenerateCampaignMapArtResponse>> GenerateMapArt(Guid campaignId, [FromBody] GenerateCampaignMapArtRequest request, CancellationToken cancellationToken)
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

        if (!TryGetOpenAiImageConfiguration(out var apiKey, out var imagesUrl, out var model))
        {
            return Problem(title: "Map art generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        try
        {
            var labels = new List<CampaignMapLabelDto>();
            var backgroundImageUrl = await SendOpenAiImagePromptAsync(
                apiKey,
                imagesUrl,
                model,
                BuildCampaignMapArtPrompt(campaign, request),
                cancellationToken);

            if (request.SeparateLabels is true)
            {
                labels = await GenerateCampaignMapArtLabelsAsync(campaign, request, cancellationToken);
            }

            return Ok(new GenerateCampaignMapArtResponse(backgroundImageUrl, labels));
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Map art generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Map art generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
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

    private static string DescribeCreateFailure(Exception exception)
    {
        var detail = exception.GetBaseException().Message.Trim();

        if (detail.Contains("no column named", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("has no column named", StringComparison.OrdinalIgnoreCase)
            || detail.Contains("no such table", StringComparison.OrdinalIgnoreCase))
        {
            return "The production database schema is outdated. " + detail;
        }

        return string.IsNullOrWhiteSpace(detail)
            ? "The server could not persist the campaign."
            : detail;
    }

    private bool TryGetOpenAiConfiguration(out string apiKey, out string responsesUrl, out string model)
    {
        apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"] ?? string.Empty;
        responsesUrl = configuration["OpenAI:ResponsesUrl"] ?? DefaultResponsesUrl;
        model = configuration["OpenAI:Model"] ?? DefaultModel;

        return !string.IsNullOrWhiteSpace(apiKey);
    }

    private bool TryGetOpenAiImageConfiguration(out string apiKey, out string imagesUrl, out string model)
    {
        apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"] ?? string.Empty;
        imagesUrl = configuration["OpenAI:ImagesUrl"] ?? DefaultImagesUrl;
        model = configuration["OpenAI:ImageModel"] ?? DefaultImageModel;

        return !string.IsNullOrWhiteSpace(apiKey);
    }

    private async Task<string> SendOpenAiPromptAsync(
        string apiKey,
        string responsesUrl,
        string model,
        string prompt,
        string? referenceImageUrl,
        double temperature,
        int maxOutputTokens,
        object? textFormat,
        bool fallbackToPlainTextOnBadRequest,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();

        using var response = await SendResponsesApiRequestAsync(
            client,
            apiKey,
            responsesUrl,
            model,
            prompt,
            referenceImageUrl,
            temperature,
            maxOutputTokens,
            textFormat,
            cancellationToken);

        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode && fallbackToPlainTextOnBadRequest && textFormat is not null && response.StatusCode == System.Net.HttpStatusCode.BadRequest)
        {
            using var fallbackResponse = await SendResponsesApiRequestAsync(
                client,
                apiKey,
                responsesUrl,
                model,
                prompt,
                referenceImageUrl: null,
                temperature,
                maxOutputTokens,
                textFormat: null,
                cancellationToken: cancellationToken);

            body = await fallbackResponse.Content.ReadAsStringAsync(cancellationToken);

            if (!fallbackResponse.IsSuccessStatusCode)
            {
                var fallbackDetail = body.Length > 240 ? body[..240] : body;
                throw new HttpRequestException($"OpenAI request failed ({(int)fallbackResponse.StatusCode}): {fallbackDetail}", null, fallbackResponse.StatusCode);
            }

            var fallbackPayload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
            var fallbackText = ExtractResponseText(fallbackPayload);
            if (string.IsNullOrWhiteSpace(fallbackText))
            {
                throw new InvalidOperationException("The model returned no text.");
            }

            return fallbackText;
        }

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

    private static HttpRequestMessage BuildResponsesApiRequest(
        string apiKey,
        string responsesUrl,
        string model,
        string prompt,
        string? referenceImageUrl,
        double temperature,
        int maxOutputTokens,
        object? textFormat)
    {
        var content = new Dictionary<string, object?>
        {
            ["model"] = model,
            ["temperature"] = temperature,
            ["max_output_tokens"] = maxOutputTokens,
            ["input"] = string.IsNullOrWhiteSpace(referenceImageUrl)
                ? prompt
                : new object[]
                {
                    new Dictionary<string, object?>
                    {
                        ["role"] = "user",
                        ["content"] = new object[]
                        {
                            new Dictionary<string, object?>
                            {
                                ["type"] = "input_text",
                                ["text"] = prompt
                            },
                            new Dictionary<string, object?>
                            {
                                ["type"] = "input_image",
                                ["image_url"] = referenceImageUrl
                            }
                        }
                    }
                }
        };

        if (textFormat is not null)
        {
            content["text"] = new Dictionary<string, object?>
            {
                ["format"] = textFormat
            };
        }

        return new HttpRequestMessage(HttpMethod.Post, responsesUrl)
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim())
            },
            Content = JsonContent.Create(content)
        };
    }

    private static async Task<HttpResponseMessage> SendResponsesApiRequestAsync(
        HttpClient client,
        string apiKey,
        string responsesUrl,
        string model,
        string prompt,
        string? referenceImageUrl,
        double temperature,
        int maxOutputTokens,
        object? textFormat,
        CancellationToken cancellationToken)
    {
        using var message = BuildResponsesApiRequest(apiKey, responsesUrl, model, prompt, referenceImageUrl, temperature, maxOutputTokens, textFormat);
        return await client.SendAsync(message, cancellationToken);
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
            referenceImageUrl: null,
            temperature: 0.1,
            maxOutputTokens: maxOutputTokens,
            textFormat: null,
            fallbackToPlainTextOnBadRequest: false,
            cancellationToken: cancellationToken);
    }

    private async Task<string> SendOpenAiImagePromptAsync(
        string apiKey,
        string imagesUrl,
        string model,
        string prompt,
        CancellationToken cancellationToken)
    {
        var client = httpClientFactory.CreateClient();
        using var message = new HttpRequestMessage(HttpMethod.Post, imagesUrl)
        {
            Headers =
            {
                Authorization = new AuthenticationHeaderValue("Bearer", apiKey.Trim())
            },
            Content = JsonContent.Create(new Dictionary<string, object?>
            {
                ["model"] = model,
                ["prompt"] = prompt,
                ["size"] = "1536x1024",
                ["quality"] = "high"
            })
        };

        using var response = await client.SendAsync(message, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var detail = body.Length > 240 ? body[..240] : body;
            throw new HttpRequestException($"OpenAI image request failed ({(int)response.StatusCode}): {detail}", null, response.StatusCode);
        }

        var payload = JsonSerializer.Deserialize<OpenAiImageApiResponse>(body, SerializerOptions);
        var image = ExtractGeneratedImageDataUrl(payload);
        if (string.IsNullOrWhiteSpace(image))
        {
            throw new InvalidOperationException("The image model returned no image.");
        }

        return image;
    }

    private static object BuildSessionDraftJsonSchemaFormat()
    {
        return new Dictionary<string, object?>
        {
            ["type"] = "json_schema",
            ["name"] = "session_draft",
            ["strict"] = true,
            ["schema"] = new Dictionary<string, object?>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["required"] = new[]
                {
                    "title", "shortDescription", "date", "inGameLocation", "estimatedLength", "markdownNotes",
                    "scenes", "npcs", "monsters", "locations", "loot", "skillChecks", "secrets", "branchingPaths", "nextSessionHooks"
                },
                ["properties"] = new Dictionary<string, object?>
                {
                    ["title"] = BuildJsonSchemaStringProperty(),
                    ["shortDescription"] = BuildJsonSchemaStringProperty(),
                    ["date"] = BuildJsonSchemaStringProperty(),
                    ["inGameLocation"] = BuildJsonSchemaStringProperty(),
                    ["estimatedLength"] = BuildJsonSchemaStringProperty(),
                    ["markdownNotes"] = BuildJsonSchemaStringProperty("Detailed markdown DM notes with multiple sections such as summary, scene flow, complications, NPC portrayals, secrets, contingencies, and improvisation guidance. Make this substantially detailed rather than brief."),
                    ["scenes"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "title", "description", "trigger", "keyEvents", "possibleOutcomes" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["title"] = BuildJsonSchemaStringProperty(),
                            ["description"] = BuildJsonSchemaStringProperty("A usable scene description with concrete setup, stakes, and texture for the DM."),
                            ["trigger"] = BuildJsonSchemaStringProperty("What causes this scene to begin or come into focus at the table."),
                            ["keyEvents"] = BuildJsonSchemaStringArrayProperty(),
                            ["possibleOutcomes"] = BuildJsonSchemaStringArrayProperty()
                        }
                    }),
                    ["npcs"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "name", "role", "personality", "motivation", "voiceNotes" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["name"] = BuildJsonSchemaStringProperty(),
                            ["role"] = BuildJsonSchemaStringProperty(),
                            ["personality"] = BuildJsonSchemaStringProperty("Specific table-usable behavior cues rather than a single adjective."),
                            ["motivation"] = BuildJsonSchemaStringProperty("Clear, immediate goal or pressure that can drive scene play."),
                            ["voiceNotes"] = BuildJsonSchemaStringProperty("Distinct performance cues, cadence, attitude, or verbal habits for the DM.")
                        }
                    }),
                    ["monsters"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "name", "type", "challengeRating", "hp", "keyAbilities", "notes" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["name"] = BuildJsonSchemaStringProperty(),
                            ["type"] = BuildJsonSchemaStringProperty(),
                            ["challengeRating"] = BuildJsonSchemaStringProperty(),
                            ["hp"] = new Dictionary<string, object?> { ["type"] = "integer" },
                            ["keyAbilities"] = BuildJsonSchemaStringProperty("Short tactical summary of notable attacks, traits, or encounter hooks."),
                            ["notes"] = BuildJsonSchemaStringProperty("Encounter-useful notes for pacing, tactics, and presentation.")
                        }
                    }),
                    ["locations"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "name", "description", "secrets", "encounters" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["name"] = BuildJsonSchemaStringProperty(),
                            ["description"] = BuildJsonSchemaStringProperty("Evocative but practical location framing for the DM."),
                            ["secrets"] = BuildJsonSchemaStringProperty("Hidden truths, clues, or dangers tied to this location."),
                            ["encounters"] = BuildJsonSchemaStringProperty("Likely scenes, hazards, or interactions that can happen here.")
                        }
                    }),
                    ["loot"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "name", "type", "quantity", "notes" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["name"] = BuildJsonSchemaStringProperty(),
                            ["type"] = BuildJsonSchemaStringProperty(),
                            ["quantity"] = new Dictionary<string, object?> { ["type"] = "integer" },
                            ["notes"] = BuildJsonSchemaStringProperty("Why this reward matters, where it is found, or what complication comes with it.")
                        }
                    }),
                    ["skillChecks"] = BuildJsonSchemaArrayProperty(new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "situation", "skill", "dc", "successOutcome", "failureOutcome" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["situation"] = BuildJsonSchemaStringProperty(),
                            ["skill"] = BuildJsonSchemaStringProperty(),
                            ["dc"] = new Dictionary<string, object?> { ["type"] = "integer" },
                            ["successOutcome"] = BuildJsonSchemaStringProperty("Concrete positive result the party can act on immediately."),
                            ["failureOutcome"] = BuildJsonSchemaStringProperty("Interesting setback, cost, or complication instead of a dead end.")
                        }
                    }),
                    ["secrets"] = BuildJsonSchemaStringArrayProperty(),
                    ["branchingPaths"] = BuildJsonSchemaStringArrayProperty(),
                    ["nextSessionHooks"] = BuildJsonSchemaStringArrayProperty()
                }
            }
        };
    }

    private static Dictionary<string, object?> BuildJsonSchemaStringProperty(string? description = null)
    {
        var property = new Dictionary<string, object?>
        {
            ["type"] = "string"
        };

        if (!string.IsNullOrWhiteSpace(description))
        {
            property["description"] = description;
        }

        return property;
    }

    private static Dictionary<string, object?> BuildJsonSchemaStringArrayProperty()
    {
        return BuildJsonSchemaArrayProperty(BuildJsonSchemaStringProperty());
    }

    private static Dictionary<string, object?> BuildJsonSchemaArrayProperty(object items)
    {
        return new()
        {
            ["type"] = "array",
            ["items"] = items
        };
    }

    private static object BuildCampaignMapJsonSchemaFormat()
    {
        var pointSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "x", "y" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["x"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["y"] = new Dictionary<string, object?> { ["type"] = "number" }
            }
        };

        var strokeSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "color", "width", "points" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["color"] = BuildJsonSchemaStringProperty("Hex or CSS-compatible stroke color appropriate for a fantasy map."),
                ["width"] = new Dictionary<string, object?> { ["type"] = "integer" },
                ["points"] = BuildJsonSchemaArrayProperty(pointSchema)
            }
        };

        var iconSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "type", "label", "x", "y" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["type"] = BuildJsonSchemaStringProperty("One of: Keep, Town, Camp, Dungeon, Danger, Treasure, Portal, Tower."),
                ["label"] = BuildJsonSchemaStringProperty("Short evocative landmark label."),
                ["x"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["y"] = new Dictionary<string, object?> { ["type"] = "number" }
            }
        };

        var decorationSchema = new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "type", "x", "y", "scale", "rotation", "opacity" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["type"] = BuildJsonSchemaStringProperty("One of: Forest, Mountain, Hill, Reef, Cave, Ward."),
                ["x"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["y"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["scale"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["rotation"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["opacity"] = new Dictionary<string, object?> { ["type"] = "number" }
            }
        };

        var labelSchema = BuildCampaignMapLabelSchema();

        return new Dictionary<string, object?>
        {
            ["type"] = "json_schema",
            ["name"] = "campaign_map",
            ["strict"] = true,
            ["schema"] = new Dictionary<string, object?>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["required"] = new[] { "background", "strokes", "icons", "decorations", "labels", "layers" },
                ["properties"] = new Dictionary<string, object?>
                {
                    ["background"] = BuildJsonSchemaStringProperty("One of: Parchment, City, Coast, Cavern."),
                    ["strokes"] = BuildJsonSchemaArrayProperty(strokeSchema),
                    ["icons"] = BuildJsonSchemaArrayProperty(iconSchema),
                    ["decorations"] = BuildJsonSchemaArrayProperty(decorationSchema),
                    ["labels"] = BuildJsonSchemaArrayProperty(labelSchema),
                    ["layers"] = new Dictionary<string, object?>
                    {
                        ["type"] = "object",
                        ["additionalProperties"] = false,
                        ["required"] = new[] { "rivers", "mountainChains", "forestBelts" },
                        ["properties"] = new Dictionary<string, object?>
                        {
                            ["rivers"] = BuildJsonSchemaArrayProperty(strokeSchema),
                            ["mountainChains"] = BuildJsonSchemaArrayProperty(decorationSchema),
                            ["forestBelts"] = BuildJsonSchemaArrayProperty(decorationSchema)
                        }
                    }
                }
            }
        };
    }

    private static Dictionary<string, object?> BuildCampaignMapLabelSchema()
    {
        return new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "color", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "fontStyle", "textTransform", "opacity" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["text"] = BuildJsonSchemaStringProperty(),
                ["fontFamily"] = BuildJsonSchemaStringProperty("One of: display, body."),
                ["tone"] = BuildJsonSchemaStringProperty("One of: Region, Feature."),
                ["x"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["y"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["rotation"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["style"] = BuildCampaignMapLabelStyleSchema()
            }
        };
    }

    private static Dictionary<string, object?> BuildCampaignMapLabelStyleSchema()
    {
        return new Dictionary<string, object?>
        {
            ["type"] = "object",
            ["additionalProperties"] = false,
            ["required"] = new[] { "color", "backgroundColor", "borderColor", "fontFamily", "fontSize", "fontWeight", "letterSpacing", "fontStyle", "textTransform", "borderWidth", "borderRadius", "paddingX", "paddingY", "textShadow", "boxShadow", "opacity" },
            ["properties"] = new Dictionary<string, object?>
            {
                ["color"] = BuildJsonSchemaStringProperty("Text color such as #4b3a2a or rgba(...)."),
                ["backgroundColor"] = BuildJsonSchemaStringProperty("Label background such as transparent, #fff7ea, or rgba(...)."),
                ["borderColor"] = BuildJsonSchemaStringProperty("Border color such as transparent, #8a5a2b, or rgba(...)."),
                ["fontFamily"] = BuildJsonSchemaStringProperty("One of: display, body."),
                ["fontSize"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["fontWeight"] = new Dictionary<string, object?> { ["type"] = "integer" },
                ["letterSpacing"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["fontStyle"] = BuildJsonSchemaStringProperty("One of: normal, italic."),
                ["textTransform"] = BuildJsonSchemaStringProperty("One of: uppercase, none."),
                ["borderWidth"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["borderRadius"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["paddingX"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["paddingY"] = new Dictionary<string, object?> { ["type"] = "number" },
                ["textShadow"] = BuildJsonSchemaStringProperty("CSS text-shadow string such as none or 0 1px 2px rgba(0,0,0,0.3)."),
                ["boxShadow"] = BuildJsonSchemaStringProperty("CSS box-shadow string such as none or 0 4px 12px rgba(0,0,0,0.18)."),
                ["opacity"] = new Dictionary<string, object?> { ["type"] = "number" }
            }
        };
    }

    private static object BuildCampaignMapLabelsJsonSchemaFormat()
    {
        return new Dictionary<string, object?>
        {
            ["type"] = "json_schema",
            ["name"] = "campaign_map_labels",
            ["strict"] = true,
            ["schema"] = new Dictionary<string, object?>
            {
                ["type"] = "object",
                ["additionalProperties"] = false,
                ["required"] = new[] { "labels" },
                ["properties"] = new Dictionary<string, object?>
                {
                    ["labels"] = BuildJsonSchemaArrayProperty(BuildCampaignMapLabelSchema())
                }
            }
        };
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

    private static string BuildCampaignMapPrompt(CampaignDto campaign, GenerateCampaignMapRequest request)
    {
        var background = NormalizeRequestedMapBackground(request.Background);
        var mapName = string.IsNullOrWhiteSpace(request.MapName) ? "Untitled Map" : request.MapName.Trim();
        var landmarkHints = request.ExistingLandmarkLabels?.Where(label => !string.IsNullOrWhiteSpace(label)).Select(label => label.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(10).ToArray() ?? [];
        var hasReferenceImage = !string.IsNullOrWhiteSpace(request.ReferenceImageUrl);

        return string.Join('\n',
        [
            "Generate a Dungeons & Dragons campaign map payload for DungeonKeep.",
            "Return only valid JSON.",
            "Use exactly these top-level fields: background, strokes, icons, decorations, labels, layers.",
            "Do not wrap the JSON in a map, draft, data, result, or response object.",
            "layers must contain rivers, mountainChains, and forestBelts.",
            "Use coordinates normalized between 0.04 and 0.96.",
            "Generate 5 to 10 landmark icons with useful tabletop labels.",
            "Generate 2 region or feature labels.",
            "Generate 4 to 10 route strokes that fit the requested map type.",
            "Use only supported icon types: Keep, Town, Camp, Dungeon, Danger, Treasure, Portal, Tower.",
            "Use only supported decoration types: Forest, Mountain, Hill, Reef, Cave, Ward.",
            "Use only supported label tones: Region, Feature.",
            hasReferenceImage ? "Use the attached reference image as the primary geography reference for coastlines, terrain masses, and spatial layout." : "No reference image is attached; infer the geography from the campaign details.",
            "For City maps, emphasize districts, walls, wards, plazas, canals, and strongholds.",
            "For Coast maps, emphasize shorelines, ports, islands, reefs, beacons, and sea routes.",
            "For Cavern maps, emphasize tunnels, chambers, chasms, fungal groves, crystals, and buried ruins.",
            "For Parchment maps, emphasize broad overland routes, frontiers, keeps, roads, and regions.",
            string.Empty,
            $"Map name: {mapName}",
            $"Required background type: {background}",
            $"Campaign name: {campaign.Name}",
            $"Setting: {campaign.Setting}",
            $"Tone: {campaign.Tone}",
            $"Summary: {campaign.Summary}",
            $"Hook: {campaign.Hook}",
            $"Next session: {campaign.NextSession}",
            $"World notes: {(campaign.WorldNotes.Count == 0 ? "None provided." : string.Join(" | ", campaign.WorldNotes.Take(8).Select(note => $"{note.Category}: {note.Title} - {note.Content}")))}",
            $"Known NPCs: {FormatList(campaign.Npcs)}",
            $"Existing landmark labels to reuse when appropriate: {(landmarkHints.Length == 0 ? "None." : string.Join(", ", landmarkHints))}"
        ]);
    }

    private static string BuildCampaignMapRepairPrompt(string invalidOutput)
    {
        return string.Join('\n',
        [
            "Convert the provided campaign map content into valid JSON only.",
            "Do not add markdown, explanations, or code fences.",
            "Use exactly these top-level fields: background, strokes, icons, decorations, labels, layers.",
            "layers must contain rivers, mountainChains, and forestBelts.",
            string.Empty,
            "Content to repair:",
            invalidOutput
        ]);
    }

    private static string BuildCampaignMapArtPrompt(CampaignDto campaign, GenerateCampaignMapArtRequest request)
    {
        var background = NormalizeRequestedMapBackground(request.Background);
        var mapName = string.IsNullOrWhiteSpace(request.MapName) ? null : request.MapName.Trim();
        var settlementScale = NormalizeRequestedSettlementScale(request.SettlementScale);
        var parchmentLayout = NormalizeRequestedParchmentLayout(request.ParchmentLayout);
        var cavernLayout = NormalizeRequestedCavernLayout(request.CavernLayout);
        var preferredPlaceNames = request.PreferredPlaceNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray() ?? [];
        var settlementNames = request.SettlementNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray() ?? [];
        var regionNames = request.RegionNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray() ?? [];
        var ruinNames = request.RuinNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray() ?? [];
        var cavernNames = request.CavernNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(20).ToArray() ?? [];
        var additionalDirection = string.IsNullOrWhiteSpace(request.AdditionalDirection) ? null : request.AdditionalDirection.Trim();
        var separateLabels = request.SeparateLabels is true;

        var promptLines = new List<string>
        {
            "Create a detailed fantasy cartography illustration for a tabletop campaign manager.",
            separateLabels
                ? "The result should look like a professionally drawn regional map with hand-inked terrain, watercolor shading, roads, settlements, forests, mountains, and coastlines, but no visible text or lettering."
                : "The result should look like a professionally drawn regional map with hand-inked terrain, watercolor shading, roads, settlements, forests, mountains, coastlines, and fantasy labels.",
            "Do not create a battlemap, token layout, grid, character portrait, or UI screenshot.",
            "Compose the image as a wide map background suitable for overlaying interactive routes and landmarks.",
            $"Requested map type: {background}.",
            "Treat the requested map type and any provided settlement-size or layout option as a hard composition requirement."
        };

        if (background == "City")
        {
            promptLines.Add($"Primary settlement scale: {settlementScale}.");
        }

        if (background == "Parchment")
        {
            promptLines.Add($"Parchment layout: {parchmentLayout}.");
        }

        if (background == "Cavern")
        {
            promptLines.Add($"Cavern layout: {cavernLayout}.");
        }

        promptLines.AddRange(
        [
            $"Campaign name: {campaign.Name}.",
            $"Setting: {campaign.Setting}.",
            $"Tone: {campaign.Tone}.",
            $"Summary: {campaign.Summary}.",
            $"Hook: {campaign.Hook}.",
            $"Next session: {campaign.NextSession}.",
            $"World notes: {(campaign.WorldNotes.Count == 0 ? "None provided." : string.Join(" | ", campaign.WorldNotes.Take(8).Select(note => $"{note.Category}: {note.Title} - {note.Content}")))}",
            "Art direction:",
            "- High-detail atlas quality.",
            "- Readable geography and terrain masses.",
            separateLabels ? "- Do not render any text, labels, legends, street names, title cartouches, or lettering into the image." : "- Elegant but not oversized labels.",
            "- Leave clear shapes and negative space so UI overlays remain readable.",
            "- Avoid giant decorative borders, giant legends, character figures, or scene illustration framing.",
            $"Preferred settlement names: {(settlementNames.Length == 0 ? "None provided." : string.Join(", ", settlementNames))}",
            $"Preferred region names: {(regionNames.Length == 0 ? "None provided." : string.Join(", ", regionNames))}",
            $"Preferred ruin names: {(ruinNames.Length == 0 ? "None provided." : string.Join(", ", ruinNames))}",
            $"Preferred cavern names: {(cavernNames.Length == 0 ? "None provided." : string.Join(", ", cavernNames))}",
            $"Uncategorized preferred place names: {(preferredPlaceNames.Length == 0 ? "None provided." : string.Join(", ", preferredPlaceNames))}"
        ]);

        if (mapName is not null && !separateLabels)
        {
            promptLines.Add($"Map title: {mapName}.");
        }
        else if (!separateLabels)
        {
            promptLines.Add("- No map title was provided. Invent a fitting fantasy map title if visible title lettering appears in the artwork.");
        }

        if (separateLabels)
        {
            promptLines.Add("- Any place names should be implied visually only; do not paint them into the final image because labels will be overlaid separately in the UI.");
        }

        if (background == "City" && (settlementNames.Length > 0 || regionNames.Length > 0 || ruinNames.Length > 0 || cavernNames.Length > 0))
        {
            promptLines.Add("- For settlement maps, interpret the provided categories as follows: settlement names are names for the city, town, borough, or harbor itself; region names are district, ward, dock, or neighborhood names; ruin names are landmark, plaza, temple, keep, bridge, or guildhall names; cavern names are street, lane, avenue, gate, or canal names.");
            promptLines.Add("- Prefer these urban naming categories over inventing generic district or street labels.");
        }
        else if (background == "Cavern" && (settlementNames.Length > 0 || regionNames.Length > 0 || ruinNames.Length > 0 || cavernNames.Length > 0))
        {
            promptLines.Add("- For cavern maps, interpret the provided categories as follows: settlement names are enclave, camp, outpost, buried district, or undercity names; region names are names for major chambers, fungal groves, lava fields, sink basins, or broad underground zones; ruin names are names for vaults, shrines, crystal halls, dens, and other named subterranean landmarks; cavern names are names for tunnels, chasms, fissures, bridge runs, and connective passages.");
            promptLines.Add("- Prefer these subterranean naming categories over inventing generic chamber or tunnel labels.");
        }
        else if (settlementNames.Length > 0 || regionNames.Length > 0 || ruinNames.Length > 0 || cavernNames.Length > 0)
        {
            promptLines.Add("- When visible labels are included, use settlement names for towns and cities, region names for territories and major natural areas, ruin names for ruins and landmark sites, and cavern names for subterranean locations.");
            promptLines.Add("- Prefer the provided categorized names over inventing replacements for those label types.");
        }

        if (preferredPlaceNames.Length > 0)
        {
            promptLines.Add("- When visible map labels are included, strongly prefer the provided place names over inventing new settlement or region names.");
        }

        if (additionalDirection is not null)
        {
            promptLines.Add($"- Additional direction: {additionalDirection}");
        }

        if (background == "City")
        {
            promptLines.Add(settlementScale switch
            {
                "Hamlet" => "- The settlement should read as a hamlet: very small, sparse, and modest rather than urban.",
                "Village" => "- The settlement should read clearly as a village: small, compact, and rural, not a major city.",
                "Town" => "- The settlement should read as a town: a moderate urban hub, larger than a village but not a city sprawl.",
                "Metropolis" => "- The settlement should read as a metropolis with dominant urban scale, major districts, and large civic structures.",
                _ => "- The settlement should read clearly as a city with substantial urban massing and civic landmarks."
            });
            promptLines.Add("- Match the visible footprint, street density, district count, and monument scale to the requested settlement size. Do not render a larger settlement than requested.");
        }

        if (background == "Parchment")
        {
            promptLines.Add(parchmentLayout switch
            {
                "Uniform" => "- Distribute geography fairly evenly across the map instead of centering everything on one dominant landmass.",
                "Archipelago" => "- Favor island chains, scattered coasts, and broken maritime landmasses.",
                "Atoll" => "- Favor ring-shaped islands, lagoons, and coral-style ocean geography.",
                "World" => "- Give the composition a broad world-map feeling with large-scale global geography.",
                "Equirectangular" => "- Use a projection-style world layout suitable for a full globe map in an equirectangular presentation.",
                _ => "- Favor one dominant continental landmass with surrounding seas and secondary coasts."
            });
            promptLines.Add("- The parchment layout must drive the overall landmass and ocean composition. Do not mix in a conflicting continent arrangement.");
        }

        if (background == "Cavern")
        {
            promptLines.Add(cavernLayout switch
            {
                "GrandCavern" => "- Favor one immense central cavern with secondary chambers and branching access tunnels.",
                "VerticalChasm" => "- Favor steep drops, layered ledges, suspended bridges, shafts, and vertical depth.",
                "CrystalGrotto" => "- Favor luminous crystal chambers, reflective mineral growths, and radiant grotto spaces.",
                "RuinedUndercity" => "- Favor buried architecture, collapsed streets, broken halls, and the remains of a lost undercity.",
                "LavaTubes" => "- Favor volcanic tunnels, magma-cut passages, heat-scarred rock, and molten fissures.",
                _ => "- Favor a dense network of connected tunnels and chambers rather than one open cave hall."
            });
            promptLines.Add("- The cavern layout must control the primary underground structure and traversal pattern. Do not mix in a conflicting cave arrangement.");
        }

        promptLines.Add(background switch
        {
            "City" => "- Emphasize districts, walls, canals, plazas, bridges, towers, and strongholds.",
            "Coast" => "- Emphasize shoreline drama, harbors, islands, reefs, headlands, sea lanes, and coves.",
            "Cavern" => "- Emphasize subterranean chambers, tunnels, chasms, fungal groves, crystals, and buried ruins.",
            _ => "- Emphasize broad overland geography, roads, rivers, forests, mountains, borders, and settlements."
        });

        return string.Join('\n', promptLines);
    }

    private static string BuildCampaignMapArtLabelsPrompt(CampaignDto campaign, GenerateCampaignMapArtRequest request)
    {
        var background = NormalizeRequestedMapBackground(request.Background);
        var mapName = string.IsNullOrWhiteSpace(request.MapName) ? campaign.Name.Trim() : request.MapName.Trim();
        var settlementNames = request.SettlementNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(12).ToArray() ?? [];
        var regionNames = request.RegionNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(12).ToArray() ?? [];
        var ruinNames = request.RuinNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(12).ToArray() ?? [];
        var cavernNames = request.CavernNames?.Where(name => !string.IsNullOrWhiteSpace(name)).Select(name => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(12).ToArray() ?? [];

        return string.Join('\n',
        [
            "Generate overlay labels for a fantasy map in DungeonKeep.",
            "Return only valid JSON matching the provided schema.",
            "Create 3 to 8 labels that would make sense as movable overlay labels on top of the generated map art.",
            "Use coordinates normalized between 0.08 and 0.92.",
            "Spread labels across the composition and avoid stacking them directly on top of one another.",
            "Use tone Region for broad territories, districts, seas, or named zones.",
            "Use tone Feature for roads, gates, ruins, landmarks, bridges, passes, tunnels, or similar points of interest.",
            "Each label must include a full style object that visually fits the art: text color, backgroundColor, borderColor, fontFamily, fontSize in rem, fontWeight, letterSpacing in em, fontStyle, textTransform, borderWidth, borderRadius, paddingX, paddingY, textShadow, boxShadow, and opacity.",
            "Use the style object to decide the complete label treatment, but keep generated labels background-free. Prefer bare ink, glow, or shadow treatment over plaques, cartouches, banners, or framed markers.",
            "Take the underlying map art into account when styling each label. Maintain strong local contrast against the terrain, watercolor wash, and linework beneath the label.",
            "Prefer solving contrast with the text color itself first, plus shadow or glow if needed. Do not rely on background plaques unless absolutely necessary.",
            "Do not place dark text directly on dark terrain or water. Change the text color to a contrasting light or warm tone first, and only add a background if readability still fails.",
            "For generated labels, keep backgroundColor transparent, borderColor transparent, borderWidth 0, paddingX 0, paddingY 0, and boxShadow none. Use text color and textShadow for readability.",
            "If there is any doubt about readability, prefer stronger text contrast and clearer text shadow over adding a label background.",
            "Visibility matters more than subtlety. Labels should still feel integrated with the art, but they must remain clearly readable.",
            "Let large region labels feel grand and integrated with the art. Let feature labels feel smaller, subtler, and more embedded in the composition.",
            "Prefer the provided names whenever they fit; invent concise fantasy names only when needed to fill gaps.",
            string.Empty,
            $"Map type: {background}",
            $"Map title or focal name: {mapName}",
            $"Campaign name: {campaign.Name}",
            $"Setting: {campaign.Setting}",
            $"Tone: {campaign.Tone}",
            $"Summary: {campaign.Summary}",
            $"Hook: {campaign.Hook}",
            $"World notes: {(campaign.WorldNotes.Count == 0 ? "None provided." : string.Join(" | ", campaign.WorldNotes.Take(8).Select(note => $"{note.Category}: {note.Title} - {note.Content}")))}",
            $"Preferred settlement names: {(settlementNames.Length == 0 ? "None provided." : string.Join(", ", settlementNames))}",
            $"Preferred region names: {(regionNames.Length == 0 ? "None provided." : string.Join(", ", regionNames))}",
            $"Preferred ruin names: {(ruinNames.Length == 0 ? "None provided." : string.Join(", ", ruinNames))}",
            $"Preferred cavern names: {(cavernNames.Length == 0 ? "None provided." : string.Join(", ", cavernNames))}"
        ]);
    }

    private static string BuildCampaignMapArtLabelsRepairPrompt(string invalidOutput)
    {
        return string.Join('\n',
        [
            "Convert the provided map label content into valid JSON only.",
            "Do not add markdown, explanations, or code fences.",
            "Use exactly one top-level field: labels.",
            "Each label object must contain text, tone, x, y, rotation, and style.",
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
            "Do not wrap the JSON in a session, draft, data, result, or response object.",
            "markdownNotes must be substantially detailed and useful at the table, not a short summary.",
            "markdownNotes should read like a DM prep document with multiple markdown sections such as Overview, Scene Flow, NPC Plays, Secrets and Revelations, Combat or Tension Beats, Contingencies, and Improvisation Hooks.",
            "Favor concrete table-ready material over vague atmosphere.",
            "scenes must be an array of objects with: title, description, trigger, keyEvents, possibleOutcomes.",
            "npcs must be an array of objects with: name, role, personality, motivation, voiceNotes.",
            "monsters must be an array of objects with: name, type, challengeRating, hp, keyAbilities, notes.",
            "locations must be an array of objects with: name, description, secrets, encounters.",
            "loot must be an array of objects with: name, type, quantity, notes.",
            "skillChecks must be an array of objects with: situation, skill, dc, successOutcome, failureOutcome.",
            "secrets, branchingPaths, and nextSessionHooks must be arrays of concise strings.",
            "Write richer descriptions, stronger motivations, and more specific outcomes than a minimal outline would provide.",
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
            "Do not wrap the JSON in a session, draft, data, result, or response object.",
            "markdownNotes must remain substantially detailed and preserve as much actionable DM prep as possible.",
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
            "motivations, goals, and fears must each be a non-empty string with a concrete, table-usable sentence.",
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
            "motivations, goals, and fears must each be a non-empty string with a concrete sentence.",
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

    private static GenerateNpcDraftResponse NormalizeNpcDraft(GenerateNpcDraftPayload generated, GenerateNpcDraftRequest request)
    {
        var motivations = ResolveNpcMotivations(generated, request);
        var goals = ResolveNpcGoals(generated, request, motivations);
        var fears = ResolveNpcFears(generated, request);

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
            Motivations: motivations,
            Goals: goals,
            Fears: fears,
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

    private static string ResolveNpcMotivations(GenerateNpcDraftPayload generated, GenerateNpcDraftRequest request)
    {
        return FirstNonEmpty(
            generated.Motivations,
            request.MotivationHint,
            generated.Notes,
            generated.ShortDescription,
            "Driven by a personal agenda that can pull the party into their orbit.");
    }

    private static string ResolveNpcGoals(GenerateNpcDraftPayload generated, GenerateNpcDraftRequest request, string motivations)
    {
        var explicitGoal = FirstNonEmpty(generated.Goals, null, null, null, string.Empty);
        if (!string.IsNullOrWhiteSpace(explicitGoal))
        {
            return explicitGoal;
        }

        var contextualGoal = FirstNonEmpty(generated.Notes, request.NotesHint, generated.CurrentStatus, generated.Location, string.Empty);
        if (!string.IsNullOrWhiteSpace(contextualGoal))
        {
            return $"Trying to make concrete progress on {contextualGoal.Trim().TrimEnd('.')}.";
        }

        return $"Trying to turn this drive into action: {motivations.Trim().TrimEnd('.')}.";
    }

    private static string ResolveNpcFears(GenerateNpcDraftPayload generated, GenerateNpcDraftRequest request)
    {
        var explicitFear = FirstNonEmpty(generated.Fears, null, null, null, string.Empty);
        if (!string.IsNullOrWhiteSpace(explicitFear))
        {
            return explicitFear;
        }

        var flaw = NormalizeStringList(generated.Flaws, 1).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(flaw))
        {
            return $"Fears this weakness will be exploited: {flaw.Trim().TrimEnd('.')}.";
        }

        var secret = NormalizeStringList(generated.Secrets, 1).FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(secret))
        {
            return $"Fears this secret being exposed: {secret.Trim().TrimEnd('.')}.";
        }

        return FirstNonEmpty(
            request.NotesHint,
            generated.Notes,
            generated.Backstory,
            generated.CurrentStatus,
            "Afraid of exposure, failure, or losing control when the pressure rises.");
    }

    private static string FirstNonEmpty(string? first, string? second, string? third, string? fourth, string fallback)
    {
        return new[] { first, second, third, fourth }
            .Select(CleanText)
            .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value))
            ?? fallback;
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

            var recovered = TryRecoverSessionDraftPayload(candidate);
            if (recovered is not null)
            {
                return recovered;
            }
        }

        return null;
    }

    private static GenerateSessionDraftPayload? TryRecoverSessionDraftPayload(string candidate)
    {
        try
        {
            using var document = JsonDocument.Parse(candidate);
            var root = SelectSessionDraftRoot(document.RootElement);

            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return new GenerateSessionDraftPayload(
                Title: GetOptionalString(root, "title"),
                ShortDescription: GetOptionalString(root, "shortDescription"),
                Date: GetOptionalString(root, "date"),
                InGameLocation: GetOptionalString(root, "inGameLocation"),
                EstimatedLength: GetOptionalString(root, "estimatedLength"),
                MarkdownNotes: GetOptionalString(root, "markdownNotes"),
                Scenes: GetOptionalObjectList(root, "scenes", MapSessionScenePayload),
                Npcs: GetOptionalObjectList(root, "npcs", MapSessionNpcPayload),
                Monsters: GetOptionalObjectList(root, "monsters", MapSessionMonsterPayload),
                Locations: GetOptionalObjectList(root, "locations", MapSessionLocationPayload),
                Loot: GetOptionalObjectList(root, "loot", MapSessionLootItemPayload),
                SkillChecks: GetOptionalObjectList(root, "skillChecks", MapSessionSkillCheckPayload),
                Secrets: GetOptionalStringList(root, "secrets"),
                BranchingPaths: GetOptionalStringList(root, "branchingPaths"),
                NextSessionHooks: GetOptionalStringList(root, "nextSessionHooks"));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonElement SelectSessionDraftRoot(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root;
        }

        if (LooksLikeSessionDraftObject(root))
        {
            return root;
        }

        foreach (var propertyName in new[] { "session", "draft", "data", "result", "response" })
        {
            if (TryGetPropertyIgnoreCase(root, propertyName, out var nested) && nested.ValueKind == JsonValueKind.Object && LooksLikeSessionDraftObject(nested))
            {
                return nested;
            }
        }

        return root;
    }

    private static bool LooksLikeSessionDraftObject(JsonElement candidate)
    {
        if (candidate.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        foreach (var propertyName in new[] { "title", "shortDescription", "markdownNotes", "scenes", "skillChecks", "nextSessionHooks" })
        {
            if (TryGetPropertyIgnoreCase(candidate, propertyName, out _))
            {
                return true;
            }
        }

        return false;
    }

    private static GenerateCampaignMapPayload? TryParseGeneratedCampaignMapPayload(string rawText)
    {
        foreach (var candidate in BuildJsonCandidates(rawText))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<GenerateCampaignMapPayload>(candidate, SerializerOptions);
                if (parsed is not null)
                {
                    return parsed;
                }
            }
            catch (JsonException)
            {
            }

            var recovered = TryRecoverCampaignMapPayload(candidate);
            if (recovered is not null)
            {
                return recovered;
            }
        }

        return null;
    }

    private static GenerateCampaignMapLabelsPayload? TryParseGeneratedCampaignMapLabelsPayload(string rawText)
    {
        foreach (var candidate in BuildJsonCandidates(rawText))
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<GenerateCampaignMapLabelsPayload>(candidate, SerializerOptions);
                if (parsed is not null)
                {
                    return parsed;
                }
            }
            catch (JsonException)
            {
            }

            try
            {
                using var document = JsonDocument.Parse(candidate);
                var root = SelectCampaignMapLabelsRoot(document.RootElement);
                if (root.ValueKind != JsonValueKind.Object)
                {
                    continue;
                }

                return new GenerateCampaignMapLabelsPayload(GetOptionalObjectList(root, "labels", MapGeneratedCampaignMapLabelPayload));
            }
            catch (JsonException)
            {
            }
        }

        return null;
    }

    private static JsonElement SelectCampaignMapLabelsRoot(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root;
        }

        if (TryGetPropertyIgnoreCase(root, "labels", out _))
        {
            return root;
        }

        foreach (var propertyName in new[] { "data", "result", "response", "map", "draft" })
        {
            if (TryGetPropertyIgnoreCase(root, propertyName, out var nested) && nested.ValueKind == JsonValueKind.Object && TryGetPropertyIgnoreCase(nested, "labels", out _))
            {
                return nested;
            }
        }

        return root;
    }

    private static GenerateCampaignMapPayload? TryRecoverCampaignMapPayload(string candidate)
    {
        try
        {
            using var document = JsonDocument.Parse(candidate);
            var root = SelectCampaignMapRoot(document.RootElement);

            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return new GenerateCampaignMapPayload(
                Background: GetOptionalString(root, "background"),
                Strokes: GetOptionalObjectList(root, "strokes", MapGeneratedCampaignMapStrokePayload),
                Icons: GetOptionalObjectList(root, "icons", MapGeneratedCampaignMapIconPayload),
                Decorations: GetOptionalObjectList(root, "decorations", MapGeneratedCampaignMapDecorationPayload),
                Labels: GetOptionalObjectList(root, "labels", MapGeneratedCampaignMapLabelPayload),
                Layers: TryGetPropertyIgnoreCase(root, "layers", out var layersElement) ? MapGeneratedCampaignMapLayersPayload(layersElement) : null);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonElement SelectCampaignMapRoot(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root;
        }

        if (LooksLikeCampaignMapObject(root))
        {
            return root;
        }

        foreach (var propertyName in new[] { "map", "draft", "data", "result", "response" })
        {
            if (TryGetPropertyIgnoreCase(root, propertyName, out var nested) && nested.ValueKind == JsonValueKind.Object && LooksLikeCampaignMapObject(nested))
            {
                return nested;
            }
        }

        return root;
    }

    private static bool LooksLikeCampaignMapObject(JsonElement candidate)
    {
        if (candidate.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        foreach (var propertyName in new[] { "background", "strokes", "icons", "decorations", "labels", "layers" })
        {
            if (TryGetPropertyIgnoreCase(candidate, propertyName, out _))
            {
                return true;
            }
        }

        return false;
    }

    private static GenerateCampaignMapStrokePayload? MapGeneratedCampaignMapStrokePayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapStrokePayload(
            Color: GetOptionalString(element, "color"),
            Width: GetOptionalInt(element, "width"),
            Points: GetOptionalObjectList(element, "points", MapGeneratedCampaignMapPointPayload));
    }

    private static GenerateCampaignMapPointPayload? MapGeneratedCampaignMapPointPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapPointPayload(
            X: GetOptionalDouble(element, "x"),
            Y: GetOptionalDouble(element, "y"));
    }

    private static GenerateCampaignMapIconPayload? MapGeneratedCampaignMapIconPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapIconPayload(
            Type: GetOptionalString(element, "type"),
            Label: GetOptionalString(element, "label"),
            X: GetOptionalDouble(element, "x"),
            Y: GetOptionalDouble(element, "y"));
    }

    private static GenerateCampaignMapDecorationPayload? MapGeneratedCampaignMapDecorationPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapDecorationPayload(
            Type: GetOptionalString(element, "type"),
            X: GetOptionalDouble(element, "x"),
            Y: GetOptionalDouble(element, "y"),
            Scale: GetOptionalDouble(element, "scale"),
            Rotation: GetOptionalDouble(element, "rotation"),
            Opacity: GetOptionalDouble(element, "opacity"));
    }

    private static GenerateCampaignMapLabelPayload? MapGeneratedCampaignMapLabelPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapLabelPayload(
            Text: GetOptionalString(element, "text"),
            Tone: GetOptionalString(element, "tone"),
            X: GetOptionalDouble(element, "x"),
            Y: GetOptionalDouble(element, "y"),
            Rotation: GetOptionalDouble(element, "rotation"),
            Style: GetOptionalObject(element, "style", MapGeneratedCampaignMapLabelStylePayload));
    }

    private static GenerateCampaignMapLabelStylePayload? MapGeneratedCampaignMapLabelStylePayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapLabelStylePayload(
            Color: GetOptionalString(element, "color"),
            BackgroundColor: GetOptionalString(element, "backgroundColor"),
            BorderColor: GetOptionalString(element, "borderColor"),
            FontFamily: GetOptionalString(element, "fontFamily"),
            FontSize: GetOptionalDouble(element, "fontSize"),
            FontWeight: GetOptionalInt(element, "fontWeight"),
            LetterSpacing: GetOptionalDouble(element, "letterSpacing"),
            FontStyle: GetOptionalString(element, "fontStyle"),
            TextTransform: GetOptionalString(element, "textTransform"),
            BorderWidth: GetOptionalDouble(element, "borderWidth"),
            BorderRadius: GetOptionalDouble(element, "borderRadius"),
            PaddingX: GetOptionalDouble(element, "paddingX"),
            PaddingY: GetOptionalDouble(element, "paddingY"),
            TextShadow: GetOptionalString(element, "textShadow"),
            BoxShadow: GetOptionalString(element, "boxShadow"),
            Opacity: GetOptionalDouble(element, "opacity"));
    }

    private static GenerateCampaignMapLayersPayload? MapGeneratedCampaignMapLayersPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateCampaignMapLayersPayload(
            Rivers: GetOptionalObjectList(element, "rivers", MapGeneratedCampaignMapStrokePayload),
            MountainChains: GetOptionalObjectList(element, "mountainChains", MapGeneratedCampaignMapDecorationPayload),
            ForestBelts: GetOptionalObjectList(element, "forestBelts", MapGeneratedCampaignMapDecorationPayload));
    }

    private static CampaignMapDto NormalizeGeneratedCampaignMap(GenerateCampaignMapPayload generated, GenerateCampaignMapRequest request)
    {
        var background = NormalizeRequestedMapBackground(generated.Background ?? request.Background);
        var fallbackStrokeColor = background switch
        {
            "Coast" => "#385f7a",
            "Cavern" => "#507255",
            "City" => "#4b3a2a",
            _ => "#8a5a2b"
        };

        var labels = (generated.Labels ?? [])
            .Select(NormalizeGeneratedCampaignMapLabel)
            .Where(label => label is not null)
            .Cast<CampaignMapLabelDto>()
            .Take(6)
            .ToList();

        return new CampaignMapDto(
            Background: background,
            BackgroundImageUrl: string.Empty,
            Strokes: (generated.Strokes ?? []).Select(stroke => NormalizeGeneratedCampaignMapStroke(stroke, fallbackStrokeColor)).Where(stroke => stroke is not null).Cast<CampaignMapStrokeDto>().Take(16).ToList(),
            Icons: (generated.Icons ?? []).Select(NormalizeGeneratedCampaignMapIcon).Where(icon => icon is not null).Cast<CampaignMapIconDto>().Take(16).ToList(),
            Tokens: [],
            Decorations: (generated.Decorations ?? []).Select(NormalizeGeneratedCampaignMapDecoration).Where(decoration => decoration is not null).Cast<CampaignMapDecorationDto>().Take(18).ToList(),
            Labels: labels.Count > 0
                ? labels
                : new List<CampaignMapLabelDto>
                {
                    new(Guid.NewGuid(), string.IsNullOrWhiteSpace(request.MapName) ? "Unnamed Reach" : request.MapName.Trim(), "Region", 0.5, 0.24, 0, DefaultGeneratedLabelStyle("Region")),
                    new(Guid.NewGuid(), background == "City" ? "Market Ward" : background == "Coast" ? "Beacon Route" : background == "Cavern" ? "Crystal Span" : "Pilgrim Road", "Feature", 0.66, 0.64, -7, DefaultGeneratedLabelStyle("Feature"))
                },
            Layers: NormalizeGeneratedCampaignMapLayers(generated.Layers, background));
    }

    private static CampaignMapLayersDto NormalizeGeneratedCampaignMapLayers(GenerateCampaignMapLayersPayload? layers, string background)
    {
        var fallbackRiverColor = background == "Coast" ? "#385f7a" : "#4a708f";
        return new CampaignMapLayersDto(
            Rivers: (layers?.Rivers ?? []).Select(stroke => NormalizeGeneratedCampaignMapStroke(stroke, fallbackRiverColor)).Where(stroke => stroke is not null).Cast<CampaignMapStrokeDto>().Take(8).ToList(),
            MountainChains: (layers?.MountainChains ?? []).Select(NormalizeGeneratedCampaignMapDecoration).Where(decoration => decoration is not null).Cast<CampaignMapDecorationDto>().Take(16).ToList(),
            ForestBelts: (layers?.ForestBelts ?? []).Select(NormalizeGeneratedCampaignMapDecoration).Where(decoration => decoration is not null).Cast<CampaignMapDecorationDto>().Take(16).ToList());
    }

    private static CampaignMapStrokeDto? NormalizeGeneratedCampaignMapStroke(GenerateCampaignMapStrokePayload? payload, string fallbackColor)
    {
        if (payload is null)
        {
            return null;
        }

        var points = (payload.Points ?? []).Select(NormalizeGeneratedCampaignMapPoint).Where(point => point is not null).Cast<CampaignMapPointDto>().ToList();
        if (points.Count < 2)
        {
            return null;
        }

        return new CampaignMapStrokeDto(Guid.NewGuid(), NormalizeGeneratedColor(payload.Color, fallbackColor), Math.Clamp(payload.Width ?? 4, 2, 18), points);
    }

    private static CampaignMapPointDto? NormalizeGeneratedCampaignMapPoint(GenerateCampaignMapPointPayload? payload)
    {
        if (payload?.X is null || payload.Y is null)
        {
            return null;
        }

        return new CampaignMapPointDto(ClampGeneratedCoordinate(payload.X.Value), ClampGeneratedCoordinate(payload.Y.Value));
    }

    private static CampaignMapIconDto? NormalizeGeneratedCampaignMapIcon(GenerateCampaignMapIconPayload? payload)
    {
        if (payload?.X is null || payload.Y is null)
        {
            return null;
        }

        return new CampaignMapIconDto(Guid.NewGuid(), NormalizeGeneratedIconType(payload.Type), string.IsNullOrWhiteSpace(payload.Label) ? "Unknown Marker" : payload.Label.Trim(), ClampGeneratedCoordinate(payload.X.Value), ClampGeneratedCoordinate(payload.Y.Value));
    }

    private static CampaignMapDecorationDto? NormalizeGeneratedCampaignMapDecoration(GenerateCampaignMapDecorationPayload? payload)
    {
        if (payload?.X is null || payload.Y is null)
        {
            return null;
        }

        var decorationType = NormalizeGeneratedDecorationType(payload.Type);

        return new CampaignMapDecorationDto(
            Guid.NewGuid(),
            decorationType,
            DefaultGeneratedDecorationColor(decorationType),
            ClampGeneratedCoordinate(payload.X.Value),
            ClampGeneratedCoordinate(payload.Y.Value),
            Math.Clamp(payload.Scale ?? 1, 0.45, 1.8),
            Math.Clamp(payload.Rotation ?? 0, -180d, 180d),
            Math.Clamp(payload.Opacity ?? 0.65, 0.18, 1));
    }

    private static CampaignMapLabelDto? NormalizeGeneratedCampaignMapLabel(GenerateCampaignMapLabelPayload? payload)
    {
        if (payload?.X is null || payload.Y is null || string.IsNullOrWhiteSpace(payload.Text))
        {
            return null;
        }

        var tone = NormalizeGeneratedLabelTone(payload.Tone);
        return new CampaignMapLabelDto(
            Guid.NewGuid(),
            payload.Text.Trim(),
            tone,
            ClampGeneratedCoordinate(payload.X.Value),
            ClampGeneratedCoordinate(payload.Y.Value),
            Math.Clamp(payload.Rotation ?? 0, -180d, 180d),
            NormalizeGeneratedLabelStyle(payload.Style, tone));
    }

    private async Task<List<CampaignMapLabelDto>> GenerateCampaignMapArtLabelsAsync(CampaignDto campaign, GenerateCampaignMapArtRequest request, CancellationToken cancellationToken)
    {
        if (!TryGetOpenAiConfiguration(out var apiKey, out var responsesUrl, out var model))
        {
            return BuildFallbackCampaignMapArtLabels(request);
        }

        try
        {
            var text = await SendOpenAiPromptAsync(
                apiKey,
                responsesUrl,
                model,
                BuildCampaignMapArtLabelsPrompt(campaign, request),
                referenceImageUrl: null,
                temperature: 0.35,
                maxOutputTokens: 900,
                textFormat: BuildCampaignMapLabelsJsonSchemaFormat(),
                fallbackToPlainTextOnBadRequest: false,
                cancellationToken: cancellationToken);

            var parsed = TryParseGeneratedCampaignMapLabelsPayload(text);
            if (parsed is null)
            {
                var repaired = await RepairJsonAsync(
                    apiKey,
                    responsesUrl,
                    model,
                    BuildCampaignMapArtLabelsRepairPrompt(text),
                    900,
                    cancellationToken);
                parsed = TryParseGeneratedCampaignMapLabelsPayload(repaired);
            }

            var normalized = (parsed?.Labels ?? [])
                .Select(NormalizeGeneratedCampaignMapLabel)
                .Where(label => label is not null)
                .Cast<CampaignMapLabelDto>()
                .Take(8)
                .ToList();

            return normalized.Count > 0 ? normalized : BuildFallbackCampaignMapArtLabels(request);
        }
        catch
        {
            return BuildFallbackCampaignMapArtLabels(request);
        }
    }

    private static List<CampaignMapLabelDto> BuildFallbackCampaignMapArtLabels(GenerateCampaignMapArtRequest request)
    {
        var background = NormalizeRequestedMapBackground(request.Background);
        var regionSlots = new (double X, double Y, double Rotation)[]
        {
            (0.5, 0.18, 0),
            (0.28, 0.34, -6),
            (0.74, 0.31, 5),
            (0.4, 0.7, -4)
        };
        var featureSlots = new (double X, double Y, double Rotation)[]
        {
            (0.68, 0.56, -8),
            (0.24, 0.62, 7),
            (0.54, 0.82, -5),
            (0.82, 0.74, 6)
        };

        var labels = new List<CampaignMapLabelDto>();
        void addLabels(IEnumerable<string>? values, string tone, (double X, double Y, double Rotation)[] slots)
        {
            foreach (var (name, index) in (values ?? []).Where(value => !string.IsNullOrWhiteSpace(value)).Select(value => value.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(slots.Length).Select((value, index) => (value, index)))
            {
                var slot = slots[index];
                labels.Add(new CampaignMapLabelDto(Guid.NewGuid(), name, tone, slot.X, slot.Y, slot.Rotation, DefaultGeneratedLabelStyle(tone)));
            }
        }

        addLabels(request.RegionNames, "Region", regionSlots);
        addLabels(request.SettlementNames, background == "City" ? "Region" : "Feature", background == "City" ? regionSlots.Skip(labels.Count).Concat(regionSlots).Take(regionSlots.Length).ToArray() : featureSlots);
        addLabels(request.RuinNames, "Feature", featureSlots);
        addLabels(request.CavernNames, "Feature", featureSlots.Skip(labels.Count % featureSlots.Length).Concat(featureSlots).Take(featureSlots.Length).ToArray());

        if (labels.Count == 0)
        {
            var primaryName = string.IsNullOrWhiteSpace(request.MapName) ? (background == "City" ? "Central Ward" : background == "Cavern" ? "Echo Span" : "Unnamed Reach") : request.MapName.Trim();
            labels.Add(new CampaignMapLabelDto(Guid.NewGuid(), primaryName, "Region", 0.5, 0.18, 0, DefaultGeneratedLabelStyle("Region")));
            labels.Add(new CampaignMapLabelDto(Guid.NewGuid(), background == "City" ? "Market Gate" : background == "Cavern" ? "Crystal Run" : background == "Coast" ? "Beacon Route" : "Pilgrim Road", "Feature", 0.68, 0.56, -8, DefaultGeneratedLabelStyle("Feature")));
        }

        return labels.Take(8).ToList();
    }

    private static string NormalizeRequestedMapBackground(string? background)
    {
        return background?.Trim().ToLowerInvariant() switch
        {
            "city" => "City",
            "coast" => "Coast",
            "cavern" => "Cavern",
            _ => "Parchment"
        };
    }

    private static string NormalizeRequestedSettlementScale(string? settlementScale)
    {
        return settlementScale?.Trim().ToLowerInvariant() switch
        {
            "hamlet" => "Hamlet",
            "village" => "Village",
            "town" => "Town",
            "metropolis" => "Metropolis",
            _ => "City"
        };
    }

    private static string NormalizeRequestedParchmentLayout(string? parchmentLayout)
    {
        return parchmentLayout?.Trim().ToLowerInvariant() switch
        {
            "uniform" => "Uniform",
            "archipelago" => "Archipelago",
            "atoll" => "Atoll",
            "world" => "World",
            "equirectangular" => "Equirectangular",
            _ => "Continent"
        };
    }

    private static string NormalizeRequestedCavernLayout(string? cavernLayout)
    {
        return cavernLayout?.Trim().ToLowerInvariant() switch
        {
            "grandcavern" or "grand cavern" => "GrandCavern",
            "verticalchasm" or "vertical chasm" => "VerticalChasm",
            "crystalgrotto" or "crystal grotto" => "CrystalGrotto",
            "ruinedundercity" or "ruined undercity" => "RuinedUndercity",
            "lavatubes" or "lava tubes" => "LavaTubes",
            _ => "TunnelNetwork"
        };
    }

    private static string NormalizeGeneratedIconType(string? iconType)
    {
        return iconType?.Trim().ToLowerInvariant() switch
        {
            "keep" => "Keep",
            "town" => "Town",
            "camp" => "Camp",
            "dungeon" => "Dungeon",
            "danger" => "Danger",
            "treasure" => "Treasure",
            "portal" => "Portal",
            "tower" => "Tower",
            _ => "Keep"
        };
    }

    private static string NormalizeGeneratedDecorationType(string? decorationType)
    {
        return decorationType?.Trim().ToLowerInvariant() switch
        {
            "forest" => "Forest",
            "mountain" => "Mountain",
            "hill" => "Hill",
            "reef" => "Reef",
            "cave" => "Cave",
            "ward" => "Ward",
            _ => "Forest"
        };
    }

    private static string NormalizeGeneratedLabelTone(string? tone)
    {
        return tone?.Trim().ToLowerInvariant() == "feature" ? "Feature" : "Region";
    }

    private static CampaignMapLabelStyleDto NormalizeGeneratedLabelStyle(GenerateCampaignMapLabelStylePayload? payload, string tone)
    {
        var defaults = DefaultGeneratedLabelStyle(tone);

        return new CampaignMapLabelStyleDto(
            NormalizeGeneratedLabelColor(payload?.Color, defaults.Color),
            defaults.BackgroundColor,
            defaults.BorderColor,
            NormalizeGeneratedLabelFontFamily(payload?.FontFamily, defaults.FontFamily),
            ClampGeneratedLabelFontSize(payload?.FontSize ?? defaults.FontSize, defaults.FontSize),
            ClampGeneratedLabelFontWeight(payload?.FontWeight ?? defaults.FontWeight, defaults.FontWeight),
            ClampGeneratedLabelLetterSpacing(payload?.LetterSpacing ?? defaults.LetterSpacing, defaults.LetterSpacing),
            NormalizeGeneratedLabelFontStyle(payload?.FontStyle, defaults.FontStyle),
            NormalizeGeneratedLabelTextTransform(payload?.TextTransform, defaults.TextTransform),
            defaults.BorderWidth,
            ClampGeneratedLabelBorderRadius(payload?.BorderRadius ?? defaults.BorderRadius, defaults.BorderRadius),
            defaults.PaddingX,
            defaults.PaddingY,
            NormalizeGeneratedLabelCssEffect(payload?.TextShadow, defaults.TextShadow),
            defaults.BoxShadow,
            ClampGeneratedLabelOpacity(payload?.Opacity ?? defaults.Opacity, defaults.Opacity));
    }

    private static CampaignMapLabelStyleDto DefaultGeneratedLabelStyle(string tone)
    {
        return tone == "Feature"
            ? new CampaignMapLabelStyleDto("#f6ead8", "transparent", "transparent", "body", 0.84d, 600, 0.08d, "italic", "none", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.72), 0 2px 10px rgba(0, 0, 0, 0.34)", "none", 0.98d)
            : new CampaignMapLabelStyleDto("#fff4e5", "transparent", "transparent", "display", 1d, 650, 0.18d, "normal", "uppercase", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.78), 0 2px 12px rgba(0, 0, 0, 0.4)", "none", 1d);
    }

    private static string NormalizeGeneratedLabelColor(string? color, string fallbackColor)
    {
        return NormalizeGeneratedLabelCssColor(color, fallbackColor);
    }

    private static string NormalizeGeneratedLabelCssColor(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(transparent|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\\([\\d\\s.,%]+\\)|hsla?\\([\\d\\s.,%]+\\))$")
            ? trimmed
            : fallback;
    }

    private static string NormalizeGeneratedLabelFontFamily(string? fontFamily, string fallback)
    {
        return string.Equals(fontFamily?.Trim(), "body", StringComparison.OrdinalIgnoreCase)
            ? "body"
            : fallback;
    }

    private static string NormalizeGeneratedLabelFontStyle(string? fontStyle, string fallback)
    {
        return string.Equals(fontStyle?.Trim(), "italic", StringComparison.OrdinalIgnoreCase) ? "italic" : fallback;
    }

    private static string NormalizeGeneratedLabelTextTransform(string? textTransform, string fallback)
    {
        return string.Equals(textTransform?.Trim(), "none", StringComparison.OrdinalIgnoreCase) ? "none" : fallback;
    }

    private static double ClampGeneratedLabelBorderWidth(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0d, 6d);
    }

    private static double ClampGeneratedLabelBorderRadius(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0d, 32d);
    }

    private static double ClampGeneratedLabelPaddingX(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0d, 24d);
    }

    private static double ClampGeneratedLabelPaddingY(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0d, 16d);
    }

    private static string NormalizeGeneratedLabelCssEffect(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && trimmed.Length <= 120 && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(none|[a-zA-Z0-9#(),.%\\s+-]+)$")
            ? trimmed
            : fallback;
    }

    private static double ClampGeneratedLabelFontSize(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0.72d, 2.4d);
    }

    private static int ClampGeneratedLabelFontWeight(int value, int fallback)
    {
        if (value <= 0)
        {
            return fallback;
        }

        return Math.Clamp((int)Math.Round(value / 50d) * 50, 400, 800);
    }

    private static double ClampGeneratedLabelLetterSpacing(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, -0.04d, 0.32d);
    }

    private static double ClampGeneratedLabelOpacity(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(value, 0.45d, 1d);
    }

    private static string NormalizeGeneratedColor(string? color, string fallbackColor)
    {
        var trimmed = color?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? fallbackColor : trimmed;
    }

    private static string DefaultGeneratedDecorationColor(string decorationType)
    {
        return decorationType switch
        {
            "Mountain" => "#4b3a2a",
            "Forest" => "#507255",
            "Reef" => "#385f7a",
            "Ward" => "#a03d2f",
            _ => "#8a5a2b"
        };
    }

    private static double ClampGeneratedCoordinate(double value)
    {
        return Math.Clamp(value, 0.04d, 0.96d);
    }

    private static string? ExtractGeneratedImageDataUrl(OpenAiImageApiResponse? payload)
    {
        var image = payload?.Data?.FirstOrDefault();
        if (!string.IsNullOrWhiteSpace(image?.B64Json))
        {
            return $"data:image/png;base64,{image.B64Json.Trim()}";
        }

        if (!string.IsNullOrWhiteSpace(image?.Url))
        {
            return image.Url.Trim();
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

            var recovered = TryRecoverNpcDraftPayload(candidate);
            if (recovered is not null)
            {
                return recovered;
            }
        }

        return null;
    }

    private static GenerateNpcDraftPayload? TryRecoverNpcDraftPayload(string candidate)
    {
        try
        {
            using var document = JsonDocument.Parse(candidate);
            var root = SelectNpcDraftRoot(document.RootElement);

            if (root.ValueKind != JsonValueKind.Object)
            {
                return null;
            }

            return new GenerateNpcDraftPayload(
                Name: GetOptionalString(root, "name"),
                Title: GetOptionalString(root, "title"),
                Race: GetOptionalString(root, "race"),
                ClassOrRole: GetOptionalString(root, "classOrRole"),
                Faction: GetOptionalString(root, "faction"),
                Occupation: GetOptionalString(root, "occupation"),
                Age: GetOptionalString(root, "age"),
                Gender: GetOptionalString(root, "gender"),
                Alignment: GetOptionalString(root, "alignment"),
                CurrentStatus: GetOptionalString(root, "currentStatus"),
                Location: GetOptionalString(root, "location"),
                ShortDescription: GetOptionalString(root, "shortDescription"),
                Appearance: GetOptionalString(root, "appearance"),
                PersonalityTraits: GetOptionalStringList(root, "personalityTraits"),
                Ideals: GetOptionalStringList(root, "ideals"),
                Bonds: GetOptionalStringList(root, "bonds"),
                Flaws: GetOptionalStringList(root, "flaws"),
                Motivations: GetOptionalString(root, "motivations"),
                Goals: GetOptionalString(root, "goals"),
                Fears: GetOptionalString(root, "fears"),
                Secrets: GetOptionalStringList(root, "secrets"),
                Mannerisms: GetOptionalStringList(root, "mannerisms"),
                VoiceNotes: GetOptionalString(root, "voiceNotes"),
                Backstory: GetOptionalString(root, "backstory"),
                Notes: GetOptionalString(root, "notes"),
                CombatNotes: GetOptionalString(root, "combatNotes"),
                StatBlockReference: GetOptionalString(root, "statBlockReference"),
                Tags: GetOptionalStringList(root, "tags"),
                QuestLinks: GetOptionalStringList(root, "questLinks"),
                SessionAppearances: GetOptionalStringList(root, "sessionAppearances"),
                Inventory: GetOptionalStringList(root, "inventory"),
                ImageUrl: GetOptionalString(root, "imageUrl"),
                IsHostile: GetOptionalBoolean(root, "isHostile"),
                IsAlive: GetOptionalBoolean(root, "isAlive"),
                IsImportant: GetOptionalBoolean(root, "isImportant"));
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static JsonElement SelectNpcDraftRoot(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object)
        {
            return root;
        }

        if (LooksLikeNpcDraftObject(root))
        {
            return root;
        }

        foreach (var propertyName in new[] { "npc", "draft", "data", "result", "response" })
        {
            if (TryGetPropertyIgnoreCase(root, propertyName, out var nested) && nested.ValueKind == JsonValueKind.Object && LooksLikeNpcDraftObject(nested))
            {
                return nested;
            }
        }

        return root;
    }

    private static bool LooksLikeNpcDraftObject(JsonElement candidate)
    {
        if (candidate.ValueKind != JsonValueKind.Object)
        {
            return false;
        }

        foreach (var propertyName in new[] { "name", "title", "race", "classOrRole", "shortDescription", "personalityTraits", "mannerisms" })
        {
            if (TryGetPropertyIgnoreCase(candidate, propertyName, out _))
            {
                return true;
            }
        }

        return false;
    }

    private static bool TryGetPropertyIgnoreCase(JsonElement element, string propertyName, out JsonElement value)
    {
        if (element.ValueKind == JsonValueKind.Object)
        {
            foreach (var property in element.EnumerateObject())
            {
                if (string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                {
                    value = property.Value;
                    return true;
                }
            }
        }

        value = default;
        return false;
    }

    private static string? GetOptionalString(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.String => value.GetString(),
            JsonValueKind.Number => value.GetRawText(),
            JsonValueKind.True => bool.TrueString,
            JsonValueKind.False => bool.FalseString,
            _ => null
        };
    }

    private static List<string>? GetOptionalStringList(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        if (value.ValueKind == JsonValueKind.Array)
        {
            return value.EnumerateArray()
                .Select(item => item.ValueKind switch
                {
                    JsonValueKind.String => item.GetString(),
                    JsonValueKind.Number => item.GetRawText(),
                    JsonValueKind.True => bool.TrueString,
                    JsonValueKind.False => bool.FalseString,
                    _ => null
                })
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Cast<string>()
                .ToList();
        }

        if (value.ValueKind == JsonValueKind.String)
        {
            var raw = value.GetString();
            if (string.IsNullOrWhiteSpace(raw))
            {
                return null;
            }

            return raw
                .Split(new[] { '\n', '\r', ';', '•' }, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(entry => entry.TrimStart('-', '*').Trim())
                .Where(entry => !string.IsNullOrWhiteSpace(entry))
                .ToList();
        }

        return null;
    }

    private static bool? GetOptionalBoolean(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.True => true,
            JsonValueKind.False => false,
            JsonValueKind.String when bool.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static int? GetOptionalInt(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetInt32(out var number) => number,
            JsonValueKind.String when int.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static double? GetOptionalDouble(JsonElement element, string propertyName)
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        return value.ValueKind switch
        {
            JsonValueKind.Number when value.TryGetDouble(out var number) => number,
            JsonValueKind.String when double.TryParse(value.GetString(), out var parsed) => parsed,
            _ => null
        };
    }

    private static List<T>? GetOptionalObjectList<T>(JsonElement element, string propertyName, Func<JsonElement, T?> map)
        where T : class
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value))
        {
            return null;
        }

        if (value.ValueKind != JsonValueKind.Array)
        {
            return null;
        }

        var items = value.EnumerateArray()
            .Select(map)
            .Where(item => item is not null)
            .Cast<T>()
            .ToList();

        return items.Count > 0 ? items : null;
    }

    private static T? GetOptionalObject<T>(JsonElement element, string propertyName, Func<JsonElement, T?> map)
        where T : class
    {
        if (!TryGetPropertyIgnoreCase(element, propertyName, out var value) || value.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return map(value);
    }

    private static GenerateSessionScenePayload? MapSessionScenePayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionScenePayload(
            Title: GetOptionalString(element, "title"),
            Description: GetOptionalString(element, "description"),
            Trigger: GetOptionalString(element, "trigger"),
            KeyEvents: GetOptionalStringList(element, "keyEvents"),
            PossibleOutcomes: GetOptionalStringList(element, "possibleOutcomes"));
    }

    private static GenerateSessionNpcPayload? MapSessionNpcPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionNpcPayload(
            Name: GetOptionalString(element, "name"),
            Role: GetOptionalString(element, "role"),
            Personality: GetOptionalString(element, "personality"),
            Motivation: GetOptionalString(element, "motivation"),
            VoiceNotes: GetOptionalString(element, "voiceNotes"));
    }

    private static GenerateSessionMonsterPayload? MapSessionMonsterPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionMonsterPayload(
            Name: GetOptionalString(element, "name"),
            Type: GetOptionalString(element, "type"),
            ChallengeRating: GetOptionalString(element, "challengeRating"),
            Hp: GetOptionalInt(element, "hp"),
            KeyAbilities: GetOptionalString(element, "keyAbilities"),
            Notes: GetOptionalString(element, "notes"));
    }

    private static GenerateSessionLocationPayload? MapSessionLocationPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionLocationPayload(
            Name: GetOptionalString(element, "name"),
            Description: GetOptionalString(element, "description"),
            Secrets: GetOptionalString(element, "secrets"),
            Encounters: GetOptionalString(element, "encounters"));
    }

    private static GenerateSessionLootItemPayload? MapSessionLootItemPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionLootItemPayload(
            Name: GetOptionalString(element, "name"),
            Type: GetOptionalString(element, "type"),
            Quantity: GetOptionalInt(element, "quantity"),
            Notes: GetOptionalString(element, "notes"));
    }

    private static GenerateSessionSkillCheckPayload? MapSessionSkillCheckPayload(JsonElement element)
    {
        if (element.ValueKind != JsonValueKind.Object)
        {
            return null;
        }

        return new GenerateSessionSkillCheckPayload(
            Situation: GetOptionalString(element, "situation"),
            Skill: GetOptionalString(element, "skill"),
            Dc: GetOptionalInt(element, "dc"),
            SuccessOutcome: GetOptionalString(element, "successOutcome"),
            FailureOutcome: GetOptionalString(element, "failureOutcome"));
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

    public sealed record GenerateCampaignMapRequest(string? Background, string? MapName, IReadOnlyList<string>? ExistingLandmarkLabels, string? ReferenceImageUrl);

    public sealed record GenerateCampaignMapArtRequest(string? Background, string? MapName, string? SettlementScale, string? ParchmentLayout, string? CavernLayout, IReadOnlyList<string>? PreferredPlaceNames, IReadOnlyList<string>? SettlementNames, IReadOnlyList<string>? RegionNames, IReadOnlyList<string>? RuinNames, IReadOnlyList<string>? CavernNames, string? AdditionalDirection, bool? SeparateLabels);

    public sealed record GenerateCampaignMapArtResponse(string BackgroundImageUrl, IReadOnlyList<CampaignMapLabelDto> Labels);

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

    private sealed record GenerateCampaignMapPayload(
        string? Background,
        List<GenerateCampaignMapStrokePayload>? Strokes,
        List<GenerateCampaignMapIconPayload>? Icons,
        List<GenerateCampaignMapDecorationPayload>? Decorations,
        List<GenerateCampaignMapLabelPayload>? Labels,
        GenerateCampaignMapLayersPayload? Layers);

    private sealed record GenerateCampaignMapLabelsPayload(List<GenerateCampaignMapLabelPayload>? Labels);

    private sealed record GenerateCampaignMapStrokePayload(string? Color, int? Width, List<GenerateCampaignMapPointPayload>? Points);
    private sealed record GenerateCampaignMapPointPayload(double? X, double? Y);
    private sealed record GenerateCampaignMapIconPayload(string? Type, string? Label, double? X, double? Y);
    private sealed record GenerateCampaignMapDecorationPayload(string? Type, double? X, double? Y, double? Scale, double? Rotation, double? Opacity);
    private sealed record GenerateCampaignMapLabelPayload(string? Text, string? Tone, double? X, double? Y, double? Rotation, GenerateCampaignMapLabelStylePayload? Style);
    private sealed record GenerateCampaignMapLabelStylePayload(string? Color, string? BackgroundColor, string? BorderColor, string? FontFamily, double? FontSize, int? FontWeight, double? LetterSpacing, string? FontStyle, string? TextTransform, double? BorderWidth, double? BorderRadius, double? PaddingX, double? PaddingY, string? TextShadow, string? BoxShadow, double? Opacity);
    private sealed record GenerateCampaignMapLayersPayload(List<GenerateCampaignMapStrokePayload>? Rivers, List<GenerateCampaignMapDecorationPayload>? MountainChains, List<GenerateCampaignMapDecorationPayload>? ForestBelts);

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

    private sealed class OpenAiImageApiResponse
    {
        [JsonPropertyName("data")]
        public List<OpenAiImageDataItem>? Data { get; init; }
    }

    private sealed class OpenAiImageDataItem
    {
        [JsonPropertyName("b64_json")]
        public string? B64Json { get; init; }

        [JsonPropertyName("url")]
        public string? Url { get; init; }
    }
}
