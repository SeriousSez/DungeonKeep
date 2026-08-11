using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace DungeonKeep.API.Controllers;

[ApiController]
[Route("api/account")]
public sealed class AccountController(IAuthService authService, ILogger<AccountController> logger) : ControllerBase
{
    private const string DefaultModel = "gpt-4.1-mini";
    private const string DefaultResponsesUrl = "https://api.openai.com/v1/responses";
    private static readonly TimeSpan OpenAiRequestTimeout = TimeSpan.FromMinutes(4);
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    [HttpPut("profile")]
    public async Task<ActionResult<AuthUserDto>> UpdateProfile(
        [FromBody] UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        try
        {
            var updated = await authService.UpdateProfileAsync(user.Id, request, cancellationToken);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("password")]
    public async Task<ActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null) return Unauthorized();

        try
        {
            await authService.ChangePasswordAsync(user.Id, request, cancellationToken);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpGet("libraries")]
    public async Task<ActionResult<UserLibrariesDto>> GetLibraries(CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        try
        {
            var libraries = await authService.GetUserLibrariesAsync(user.Id, cancellationToken);
            return Ok(libraries);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Failed to load user libraries for user {UserId}. Returning empty libraries.", user.Id);
            return Ok(new UserLibrariesDto("[]", "[]", "[]", "[]", "[]", "[]", "[]"));
        }
    }

    [HttpPut("npc-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveNpcLibrary([FromBody] SaveUserNpcLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserNpcLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("custom-table-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveCustomTableLibrary([FromBody] SaveUserCustomTableLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserCustomTableLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("monster-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveMonsterLibrary([FromBody] SaveUserMonsterLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserMonsterLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("class-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveClassLibrary([FromBody] SaveUserClassLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserClassLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("species-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveSpeciesLibrary([FromBody] SaveUserSpeciesLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserSpeciesLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPost("monster-library/generate-draft")]
    public async Task<ActionResult<GenerateMonsterDraftResponse>> GenerateMonsterDraft(
        [FromBody] GenerateMonsterDraftRequest request,
        [FromServices] IHttpClientFactory httpClientFactory,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(title: "Monster generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
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
                temperature = 0.7,
                max_output_tokens = 2200,
                input = BuildMonsterDraftPrompt(request)
            })
        };

        var client = httpClientFactory.CreateClient();
        client.Timeout = OpenAiRequestTimeout;

        try
        {
            using var response = await client.SendAsync(message, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var detail = body.Length > 280 ? body[..280] : body;
                return Problem(title: "Monster generation failed.", detail: detail, statusCode: StatusCodes.Status502BadGateway);
            }

            var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
            var text = ExtractResponseText(payload);
            if (string.IsNullOrWhiteSpace(text))
            {
                return Problem(title: "Monster generation failed.", detail: "The model returned no text.", statusCode: StatusCodes.Status502BadGateway);
            }

            var generated = TryParseGeneratedMonsterDraftPayload(text);
            if (generated is null)
            {
                return Problem(title: "Monster generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeMonsterDraft(generated, request));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Problem(title: "Monster generation timed out.", detail: "Generation is taking too long. Try again.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Monster generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
        catch (InvalidOperationException exception)
        {
            return Problem(title: "Monster generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPost("class-library/generate-draft")]
    public async Task<ActionResult<GenerateClassDraftResponse>> GenerateClassDraft(
        [FromBody] GenerateClassDraftRequest request,
        [FromServices] IHttpClientFactory httpClientFactory,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(title: "Class generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
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
                temperature = 0.7,
                max_output_tokens = 6000,
                input = BuildClassDraftPrompt(request)
            })
        };

        var client = httpClientFactory.CreateClient();
        client.Timeout = OpenAiRequestTimeout;

        try
        {
            using var response = await client.SendAsync(message, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var detail = body.Length > 280 ? body[..280] : body;
                return Problem(title: "Class generation failed.", detail: detail, statusCode: StatusCodes.Status502BadGateway);
            }

            var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
            var text = ExtractResponseText(payload);
            if (string.IsNullOrWhiteSpace(text))
            {
                return Problem(title: "Class generation failed.", detail: "The model returned no text.", statusCode: StatusCodes.Status502BadGateway);
            }

            var generated = TryParseGeneratedClassDraftPayload(text);
            if (generated is null)
            {
                return Problem(title: "Class generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeClassDraft(generated, request));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Problem(title: "Class generation timed out.", detail: "Generation is taking too long. Try again.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Class generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPost("species-library/generate-draft")]
    public async Task<ActionResult<GenerateSpeciesDraftResponse>> GenerateSpeciesDraft(
        [FromBody] GenerateSpeciesDraftRequest request,
        [FromServices] IHttpClientFactory httpClientFactory,
        [FromServices] IConfiguration configuration,
        CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var apiKey = configuration["OpenAI:ApiKey"] ?? configuration["OPENAI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Problem(title: "Species generation unavailable.", detail: "OpenAI API key is not configured.", statusCode: StatusCodes.Status503ServiceUnavailable);
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
                temperature = 0.7,
                max_output_tokens = 3000,
                input = BuildSpeciesDraftPrompt(request)
            })
        };

        var client = httpClientFactory.CreateClient();
        client.Timeout = OpenAiRequestTimeout;

        try
        {
            using var response = await client.SendAsync(message, cancellationToken);
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var detail = body.Length > 280 ? body[..280] : body;
                return Problem(title: "Species generation failed.", detail: detail, statusCode: StatusCodes.Status502BadGateway);
            }

            var payload = JsonSerializer.Deserialize<OpenAiResponsesApiResponse>(body, SerializerOptions);
            var text = ExtractResponseText(payload);
            if (string.IsNullOrWhiteSpace(text))
            {
                return Problem(title: "Species generation failed.", detail: "The model returned no text.", statusCode: StatusCodes.Status502BadGateway);
            }

            var generated = TryParseGeneratedSpeciesDraftPayload(text);
            if (generated is null)
            {
                return Problem(title: "Species generation failed.", detail: "Model output was not valid JSON.", statusCode: StatusCodes.Status502BadGateway);
            }

            return Ok(NormalizeSpeciesDraft(generated, request));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return Problem(title: "Species generation timed out.", detail: "Generation is taking too long. Try again.", statusCode: StatusCodes.Status503ServiceUnavailable);
        }
        catch (HttpRequestException exception)
        {
            return Problem(title: "Species generation failed.", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
        }
    }

    [HttpPut("monster-reference")]
    public async Task<ActionResult<UserLibrariesDto>> SaveMonsterReference([FromBody] SaveUserMonsterReferenceRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserMonsterReferenceAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    [HttpPut("audio-library")]
    public async Task<ActionResult<UserLibrariesDto>> SaveAudioLibrary([FromBody] SaveUserAudioLibraryRequest request, CancellationToken cancellationToken)
    {
        var user = await GetAuthenticatedUserAsync(cancellationToken);
        if (user is null)
        {
            return Unauthorized();
        }

        var libraries = await authService.SaveUserAudioLibraryAsync(user.Id, request.Json, cancellationToken);
        return Ok(libraries);
    }

    private async Task<AuthenticatedUser?> GetAuthenticatedUserAsync(CancellationToken cancellationToken)
    {
        var authorization = Request.Headers.Authorization.ToString();
        var token = authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
            ? authorization[7..].Trim()
            : string.Empty;

        return await authService.GetAuthenticatedUserByTokenAsync(token, cancellationToken);
    }

    private static string BuildMonsterDraftPrompt(GenerateMonsterDraftRequest request)
    {
        var existingNames = request.ExistingMonsterNames is { Count: > 0 }
            ? string.Join(", ", request.ExistingMonsterNames.Where((name) => !string.IsNullOrWhiteSpace(name)).Select((name) => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(50))
            : "none";

        return $@"You are generating a Dungeons & Dragons 5e custom monster draft for a tabletop campaign tool.
Return ONLY valid JSON. No markdown fences. No commentary.

Use this exact JSON shape:
{{
    ""name"": """",
    ""challengeRating"": """",
    ""creatureType"": """",
    ""creatureCategory"": """",
    ""size"": ""Medium"",
    ""armorClass"": 0,
    ""hitPoints"": 0,
    ""speed"": """",
    ""alignment"": """",
    ""legendary"": false,
    ""sourceLabel"": ""Custom"",
    ""abilityScores"": {{
        ""strength"": 10,
        ""dexterity"": 10,
        ""constitution"": 10,
        ""intelligence"": 10,
        ""wisdom"": 10,
        ""charisma"": 10
    }},
    ""savingThrows"": """",
    ""skills"": """",
    ""damageVulnerabilities"": """",
    ""damageResistances"": """",
    ""damageImmunities"": """",
    ""conditionImmunities"": """",
    ""senses"": """",
    ""languages"": """",
    ""challengeXp"": """",
    ""traits"": [{{""name"":"""",""description"":""""}}],
    ""actions"": [{{""name"":"""",""description"":""""}}],
    ""reactions"": [],
    ""legendaryActions"": [],
    ""notes"": """"
}}

Rules:
- Keep output concise and table-ready.
- Use realistic 5e formatting for attacks, save DCs, and recharge notation.
- If unsure about a field, provide a sensible default instead of null.
- Avoid these existing monster names: {existingNames}

Design hints:
- Name hint: {request.NameHint}
- Concept: {request.ConceptHint}
- Creature category hint: {request.CreatureCategoryHint}
- Creature type hint: {request.CreatureTypeHint}
- Challenge rating hint: {request.ChallengeRatingHint}
- Alignment hint: {request.AlignmentHint}
- Environment hint: {request.EnvironmentHint}
- Combat role hint: {request.CombatRoleHint}
- Signature ability hint: {request.SpecialAbilityHint}
- Extra notes: {request.NotesHint}";
    }

    private static string BuildClassDraftPrompt(GenerateClassDraftRequest request)
    {
        var existingNames = request.ExistingClassNames is { Count: > 0 }
            ? string.Join(", ", request.ExistingClassNames.Where((name) => !string.IsNullOrWhiteSpace(name)).Select((name) => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(50))
            : "none";

        return $@"You are generating a concise custom Dungeons & Dragons class draft.
Return ONLY valid JSON. No markdown fences. No commentary.

Use this exact JSON shape:
{{
  ""name"": """",
  ""summary"": """",
  ""hitDie"": ""d8"",
  ""primaryAbility"": """",
  ""savingThrows"": """",
  ""armorTraining"": """",
  ""weaponTraining"": """",
  ""toolTraining"": """",
    ""features"": [
        {{
            ""level"": 1,
            ""name"": """",
            ""description"": """",
            ""effects"": [
                {{""type"":""skill-proficiency"",""target"":"""",""value"":0,""scaling"":""fixed"",""targetOptions"":[]}}
            ]
        }}
    ],
  ""startingEquipment"": ["""", """"],
  ""spellcastingNotes"": """",
  ""notes"": """"
}}

Rules:
- Create a playable level 1-20 progression with 12-24 features distributed across meaningful levels. Every feature must have a level from 1 through 20, a unique name at that level, and a concise rules-facing description.
- Include core identity at level 1, meaningful improvements through all tiers, and a level 20 capstone. Do not add empty placeholder features for every level.
- Keep power near official 2024 D&D classes. Avoid unconditional stacking bonuses to Armor Class, saving throws, or ability scores. Prefer descriptive effects when the supported mechanics cannot express a rule safely.
- Effects are optional and only represent automatic character-sheet changes. Do not encode attacks, damage, spell slots, resources, advantage, resistances, senses, or action economy as effects; explain those in the description.
- Effect type must be exactly one of: ability-score, skill-bonus, skill-proficiency, skill-expertise, armor-class, speed, max-hit-points, initiative, saving-throw-bonus.
- Scaling must be exactly one of: fixed, proficiency-bonus, class-level, half-class-level. For fixed effects, value is the signed numeric bonus. For scaling effects, value is the multiplier, normally 1.
- Use target for a fixed ability or skill. Ability targets are Strength, Dexterity, Constitution, Intelligence, Wisdom, or Charisma. Skill targets use standard skill names.
- To let the player choose one target, leave target empty and put valid choices in targetOptions. Do not combine unrelated choices in one feature. Targetless types are armor-class, speed, max-hit-points, and initiative; use an empty target and empty targetOptions for them.
- For skill-proficiency and skill-expertise, use value 0 and fixed scaling.
- Keep entries brief and practical for table use.
- Use plain text and avoid null values.
- Avoid existing class names: {existingNames}

Design hints:
- User generation brief (highest priority): {request.GenerationBrief}
- Name hint: {request.NameHint}
- Theme hint: {request.ThemeHint}
- Primary role hint: {request.RoleHint}
- Signature mechanic hint: {request.MechanicHint}
- Extra notes: {request.NotesHint}";
    }

    private static string BuildSpeciesDraftPrompt(GenerateSpeciesDraftRequest request)
    {
        var existingNames = request.ExistingSpeciesNames is { Count: > 0 }
            ? string.Join(", ", request.ExistingSpeciesNames.Where((name) => !string.IsNullOrWhiteSpace(name)).Select((name) => name.Trim()).Distinct(StringComparer.OrdinalIgnoreCase).Take(50))
            : "none";

        return $@"You are generating a concise custom Dungeons & Dragons species draft.
Return ONLY valid JSON. No markdown fences. No commentary.

Use this exact JSON shape:
{{
  ""name"": """",
  ""summary"": """",
  ""size"": ""Medium"",
  ""speed"": ""30 ft."",
  ""creatureType"": ""Humanoid"",
  ""languages"": [""Common""],
    ""traits"": [
        {{
            ""name"": """",
            ""description"": """",
            ""choiceCount"": 0,
            ""choiceOptions"": [],
            ""effects"": [
                {{""type"":""speed"",""target"":"""",""value"":5,""scaling"":""fixed"",""targetOptions"":[]}}
            ]
        }}
    ],
  ""notes"": """"
}}

Rules:
- Create 3-7 distinctive, balanced traits. Keep power near official 2024 D&D species.
- A trait may ask the player to select from choiceOptions. Set choiceCount to the number required; otherwise use 0 and an empty list. Mention what the choice represents in the description.
- Effects are optional and only represent automatic character-sheet changes. Do not encode attacks, damage, spells, advantage, resistances, senses, or action economy as effects; explain those in the description.
- Effect type must be exactly one of: ability-score, skill-bonus, skill-proficiency, skill-expertise, armor-class, speed, max-hit-points, initiative, saving-throw-bonus.
- Species effect scaling must be fixed or proficiency-bonus. For fixed effects, value is the signed numeric bonus. For proficiency-bonus, value is the multiplier, normally 1.
- Use target for a fixed ability or skill. Ability targets are Strength, Dexterity, Constitution, Intelligence, Wisdom, or Charisma. Skill targets use standard skill names.
- To let the player choose one effect target, leave target empty and use targetOptions. Keep those options aligned with the trait's choiceOptions. Targetless types are armor-class, speed, max-hit-points, and initiative.
- For skill-proficiency and skill-expertise, use value 0 and fixed scaling.
- Keep entries brief and practical for table use.
- Use plain text and avoid null values.
- Avoid existing species names: {existingNames}

Design hints:
- User generation brief (highest priority): {request.GenerationBrief}
- Name hint: {request.NameHint}
- Origin hint: {request.OriginHint}
- Culture hint: {request.CultureHint}
- Signature trait hint: {request.TraitHint}
- Extra notes: {request.NotesHint}";
    }

    private static GenerateMonsterDraftPayload? TryParseGeneratedMonsterDraftPayload(string text)
    {
        if (TryDeserializeMonsterDraft(text, out var parsed))
        {
            return parsed;
        }

        var extracted = ExtractFirstJsonObject(text);
        if (string.IsNullOrWhiteSpace(extracted))
        {
            return null;
        }

        return TryDeserializeMonsterDraft(extracted, out var fromExtracted) ? fromExtracted : null;
    }

    private static GenerateClassDraftPayload? TryParseGeneratedClassDraftPayload(string text)
    {
        if (TryDeserializeClassDraft(text, out var parsed))
        {
            return parsed;
        }

        var extracted = ExtractFirstJsonObject(text);
        if (string.IsNullOrWhiteSpace(extracted))
        {
            return null;
        }

        return TryDeserializeClassDraft(extracted, out var fromExtracted) ? fromExtracted : null;
    }

    private static bool TryDeserializeClassDraft(string text, out GenerateClassDraftPayload? payload)
    {
        payload = null;
        try
        {
            payload = JsonSerializer.Deserialize<GenerateClassDraftPayload>(text, SerializerOptions);
            return payload is not null;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static GenerateSpeciesDraftPayload? TryParseGeneratedSpeciesDraftPayload(string text)
    {
        if (TryDeserializeSpeciesDraft(text, out var parsed))
        {
            return parsed;
        }

        var extracted = ExtractFirstJsonObject(text);
        if (string.IsNullOrWhiteSpace(extracted))
        {
            return null;
        }

        return TryDeserializeSpeciesDraft(extracted, out var fromExtracted) ? fromExtracted : null;
    }

    private static bool TryDeserializeSpeciesDraft(string text, out GenerateSpeciesDraftPayload? payload)
    {
        payload = null;
        try
        {
            payload = JsonSerializer.Deserialize<GenerateSpeciesDraftPayload>(text, SerializerOptions);
            return payload is not null;
        }
        catch (JsonException)
        {
            return false;
        }
    }

    private static bool TryDeserializeMonsterDraft(string text, out GenerateMonsterDraftPayload? payload)
    {
        payload = null;
        try
        {
            payload = JsonSerializer.Deserialize<GenerateMonsterDraftPayload>(text, SerializerOptions);
            return payload is not null;
        }
        catch (JsonException)
        {
            return false;
        }
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
        var escaped = false;

        for (var i = start; i < text.Length; i++)
        {
            var ch = text[i];

            if (inString)
            {
                if (escaped)
                {
                    escaped = false;
                    continue;
                }

                if (ch == '\\')
                {
                    escaped = true;
                    continue;
                }

                if (ch == '"')
                {
                    inString = false;
                }

                continue;
            }

            if (ch == '"')
            {
                inString = true;
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

    private static string ExtractResponseText(OpenAiResponsesApiResponse? payload)
    {
        if (!string.IsNullOrWhiteSpace(payload?.OutputText))
        {
            return payload.OutputText.Trim();
        }

        var textParts = new List<string>();
        foreach (var item in payload?.Output ?? new List<OpenAiResponseOutputItem>())
        {
            foreach (var content in item.Content ?? new List<OpenAiResponseContent>())
            {
                if (string.Equals(content.Type, "output_text", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(content.Text))
                {
                    textParts.Add(content.Text.Trim());
                }
            }
        }

        return string.Join("\n", textParts).Trim();
    }

    private static GenerateMonsterDraftResponse NormalizeMonsterDraft(GenerateMonsterDraftPayload generated, GenerateMonsterDraftRequest request)
    {
        var challengeRating = FirstNonEmpty(generated.ChallengeRating, request.ChallengeRatingHint, "1");
        var normalizedCategory = NormalizeCreatureCategory(FirstNonEmpty(generated.CreatureCategory, request.CreatureCategoryHint, "Other"));
        var normalizedSize = NormalizeSize(FirstNonEmpty(generated.Size, "Medium"));
        var name = FirstNonEmpty(generated.Name, request.NameHint, "Generated Monster");

        return new GenerateMonsterDraftResponse(
            Name: name,
            ChallengeRating: challengeRating,
            CreatureType: FirstNonEmpty(generated.CreatureType, request.CreatureTypeHint, "Humanoid"),
            CreatureCategory: normalizedCategory,
            Size: normalizedSize,
            ArmorClass: NormalizeNullableStat(generated.ArmorClass, 8, 30),
            HitPoints: NormalizeNullableStat(generated.HitPoints, 1, 999),
            Speed: FirstNonEmpty(generated.Speed, "30 ft."),
            Alignment: FirstNonEmpty(generated.Alignment, request.AlignmentHint, "Unaligned"),
            Legendary: generated.Legendary ?? false,
            SourceLabel: FirstNonEmpty(generated.SourceLabel, "Custom"),
            AbilityScores: new GenerateMonsterAbilityScoresResponse(
                Strength: NormalizeNullableStat(generated.AbilityScores?.Strength, 1, 30) ?? 10,
                Dexterity: NormalizeNullableStat(generated.AbilityScores?.Dexterity, 1, 30) ?? 10,
                Constitution: NormalizeNullableStat(generated.AbilityScores?.Constitution, 1, 30) ?? 10,
                Intelligence: NormalizeNullableStat(generated.AbilityScores?.Intelligence, 1, 30) ?? 10,
                Wisdom: NormalizeNullableStat(generated.AbilityScores?.Wisdom, 1, 30) ?? 10,
                Charisma: NormalizeNullableStat(generated.AbilityScores?.Charisma, 1, 30) ?? 10),
            SavingThrows: NormalizeInlineStatList(generated.SavingThrows),
            Skills: NormalizeInlineStatList(generated.Skills),
            DamageVulnerabilities: NormalizeInlineStatList(generated.DamageVulnerabilities),
            DamageResistances: NormalizeInlineStatList(generated.DamageResistances),
            DamageImmunities: NormalizeInlineStatList(generated.DamageImmunities),
            ConditionImmunities: NormalizeInlineStatList(generated.ConditionImmunities),
            Senses: NormalizeInlineStatList(generated.Senses),
            Languages: NormalizeInlineStatList(generated.Languages),
            ChallengeXp: FirstNonEmpty(generated.ChallengeXp, string.Empty),
            Traits: NormalizeEntries(generated.Traits),
            Actions: NormalizeEntries(generated.Actions),
            Reactions: NormalizeEntries(generated.Reactions),
            LegendaryActions: NormalizeEntries(generated.LegendaryActions),
            Notes: FirstNonEmpty(generated.Notes, request.NotesHint, string.Empty));
    }

    private static GenerateClassDraftResponse NormalizeClassDraft(GenerateClassDraftPayload generated, GenerateClassDraftRequest request)
    {
        var features = NormalizeClassFeatures(generated.Features, generated.KeyFeatures);
        return new GenerateClassDraftResponse(
            Name: FirstNonEmpty(generated.Name, request.NameHint, "Generated Class"),
            Summary: FirstNonEmpty(generated.Summary, request.ThemeHint, string.Empty),
            HitDie: FirstNonEmpty(generated.HitDie, "d8"),
            PrimaryAbility: FirstNonEmpty(generated.PrimaryAbility, request.RoleHint, "Strength"),
            SavingThrows: FirstNonEmpty(generated.SavingThrows, string.Empty),
            ArmorTraining: FirstNonEmpty(generated.ArmorTraining, string.Empty),
            WeaponTraining: FirstNonEmpty(generated.WeaponTraining, string.Empty),
            ToolTraining: FirstNonEmpty(generated.ToolTraining, string.Empty),
            KeyFeatures: features.Select(feature => feature.Name).Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
            Features: features,
            StartingEquipment: NormalizeTextList(generated.StartingEquipment),
            SpellcastingNotes: FirstNonEmpty(generated.SpellcastingNotes, string.Empty),
            Notes: FirstNonEmpty(generated.Notes, request.NotesHint, string.Empty));
    }

    private static GenerateSpeciesDraftResponse NormalizeSpeciesDraft(GenerateSpeciesDraftPayload generated, GenerateSpeciesDraftRequest request)
    {
        return new GenerateSpeciesDraftResponse(
            Name: FirstNonEmpty(generated.Name, request.NameHint, "Generated Species"),
            Summary: FirstNonEmpty(generated.Summary, request.OriginHint, string.Empty),
            Size: FirstNonEmpty(generated.Size, "Medium"),
            Speed: FirstNonEmpty(generated.Speed, "30 ft."),
            CreatureType: FirstNonEmpty(generated.CreatureType, "Humanoid"),
            Languages: NormalizeTextList(generated.Languages),
            Traits: NormalizeSpeciesTraits(generated.Traits),
            Notes: FirstNonEmpty(generated.Notes, request.NotesHint, string.Empty));
    }

    private static List<GenerateClassFeatureResponse> NormalizeClassFeatures(
        List<GenerateClassFeaturePayload>? features,
        List<string>? legacyFeatures)
    {
        var normalized = (features ?? [])
            .Select(feature => new GenerateClassFeatureResponse(
                Level: Math.Clamp(feature.Level ?? 1, 1, 20),
                Name: FirstNonEmpty(feature.Name, string.Empty),
                Description: FirstNonEmpty(feature.Description, string.Empty),
                Effects: NormalizeFeatureEffects(feature.Effects, allowClassLevelScaling: true)))
            .Where(feature => !string.IsNullOrWhiteSpace(feature.Name))
            .GroupBy(feature => $"{feature.Level}:{feature.Name}", StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .OrderBy(feature => feature.Level)
            .Take(40)
            .ToList();

        if (normalized.Count > 0)
        {
            return normalized;
        }

        return NormalizeTextList(legacyFeatures)
            .Select(name => new GenerateClassFeatureResponse(1, name, string.Empty, []))
            .ToList();
    }

    private static List<GenerateSpeciesTraitResponse> NormalizeSpeciesTraits(List<GenerateSpeciesTraitPayload>? traits)
    {
        return (traits ?? [])
            .Select(trait =>
            {
                var options = NormalizeTextList(trait.ChoiceOptions);
                return new GenerateSpeciesTraitResponse(
                    Name: FirstNonEmpty(trait.Name, string.Empty),
                    Description: FirstNonEmpty(trait.Description, string.Empty),
                    ChoiceCount: Math.Min(options.Count, Math.Clamp(trait.ChoiceCount ?? 0, 0, 5)),
                    ChoiceOptions: options,
                    Effects: NormalizeFeatureEffects(trait.Effects, allowClassLevelScaling: false));
            })
            .Where(trait => !string.IsNullOrWhiteSpace(trait.Name))
            .GroupBy(trait => trait.Name, StringComparer.OrdinalIgnoreCase)
            .Select(group => group.First())
            .Take(12)
            .ToList();
    }

    private static List<GenerateFeatureEffectResponse> NormalizeFeatureEffects(
        List<GenerateFeatureEffectPayload>? effects,
        bool allowClassLevelScaling)
    {
        return (effects ?? [])
            .Select(effect =>
            {
                var type = NormalizeFeatureEffectType(effect.Type);
                var scaling = NormalizeFeatureEffectScaling(effect.Scaling, allowClassLevelScaling);
                var targetOptions = NormalizeTextList(effect.TargetOptions);
                return new GenerateFeatureEffectResponse(
                    Type: type,
                    Target: FirstNonEmpty(effect.Target, string.Empty),
                    Value: Math.Clamp(effect.Value ?? 0, -20, 20),
                    Scaling: scaling,
                    TargetOptions: targetOptions);
            })
            .Where(effect => !string.IsNullOrWhiteSpace(effect.Type))
            .Where(effect => IsTargetlessFeatureEffect(effect.Type)
                || !string.IsNullOrWhiteSpace(effect.Target)
                || effect.TargetOptions.Count > 0)
            .Take(10)
            .ToList();
    }

    private static string NormalizeFeatureEffectType(string? value)
    {
        return value?.Trim() switch
        {
            "ability-score" => "ability-score",
            "skill-bonus" => "skill-bonus",
            "skill-proficiency" => "skill-proficiency",
            "skill-expertise" => "skill-expertise",
            "armor-class" => "armor-class",
            "speed" => "speed",
            "max-hit-points" => "max-hit-points",
            "initiative" => "initiative",
            "saving-throw-bonus" => "saving-throw-bonus",
            _ => string.Empty
        };
    }

    private static string NormalizeFeatureEffectScaling(string? value, bool allowClassLevelScaling)
    {
        return value?.Trim() switch
        {
            "proficiency-bonus" => "proficiency-bonus",
            "class-level" when allowClassLevelScaling => "class-level",
            "half-class-level" when allowClassLevelScaling => "half-class-level",
            _ => "fixed"
        };
    }

    private static bool IsTargetlessFeatureEffect(string type)
    {
        return type is "armor-class" or "speed" or "max-hit-points" or "initiative";
    }

    private static List<GenerateMonsterTextEntryResponse> NormalizeEntries(List<GenerateMonsterTextEntryPayload>? entries)
    {
        return (entries ?? new List<GenerateMonsterTextEntryPayload>())
            .Select((entry) => new GenerateMonsterTextEntryResponse(
                Name: FirstNonEmpty(entry.Name, string.Empty),
                Description: FirstNonEmpty(entry.Description, string.Empty)))
            .Where((entry) => !string.IsNullOrWhiteSpace(entry.Name) || !string.IsNullOrWhiteSpace(entry.Description))
            .Take(20)
            .ToList();
    }

    private static List<string> NormalizeTextList(List<string>? values)
    {
        return (values ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(20)
            .ToList();
    }

    private static string NormalizeInlineStatList(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static int? NormalizeNullableStat(int? value, int min, int max)
    {
        if (value is null)
        {
            return null;
        }

        return Math.Clamp(value.Value, min, max);
    }

    private static string NormalizeSize(string value)
    {
        return value.Trim() switch
        {
            "Tiny" => "Tiny",
            "Small" => "Small",
            "Medium" => "Medium",
            "Large" => "Large",
            "Huge" => "Huge",
            "Gargantuan" => "Gargantuan",
            _ => "Medium"
        };
    }

    private static string NormalizeCreatureCategory(string value)
    {
        return value.Trim() switch
        {
            "Aberration" => "Aberration",
            "Beast" => "Beast",
            "Celestial" => "Celestial",
            "Construct" => "Construct",
            "Dragon" => "Dragon",
            "Elemental" => "Elemental",
            "Fey" => "Fey",
            "Fiend" => "Fiend",
            "Giant" => "Giant",
            "Humanoid" => "Humanoid",
            "Monstrosity" => "Monstrosity",
            "Ooze" => "Ooze",
            "Plant" => "Plant",
            "Undead" => "Undead",
            _ => "Other"
        };
    }

    private static string FirstNonEmpty(params string?[] values)
    {
        foreach (var value in values)
        {
            if (!string.IsNullOrWhiteSpace(value))
            {
                return value.Trim();
            }
        }

        return string.Empty;
    }

    public sealed record GenerateMonsterDraftRequest(
        string? NameHint,
        string? ConceptHint,
        string? CreatureCategoryHint,
        string? CreatureTypeHint,
        string? ChallengeRatingHint,
        string? AlignmentHint,
        string? EnvironmentHint,
        string? CombatRoleHint,
        string? SpecialAbilityHint,
        string? NotesHint,
        IReadOnlyList<string>? ExistingMonsterNames);

    public sealed record GenerateClassDraftRequest(
        string? GenerationBrief,
        string? NameHint,
        string? ThemeHint,
        string? RoleHint,
        string? MechanicHint,
        string? NotesHint,
        IReadOnlyList<string>? ExistingClassNames);

    public sealed record GenerateClassDraftResponse(
        string Name,
        string Summary,
        string HitDie,
        string PrimaryAbility,
        string SavingThrows,
        string ArmorTraining,
        string WeaponTraining,
        string ToolTraining,
        List<string> KeyFeatures,
        List<GenerateClassFeatureResponse> Features,
        List<string> StartingEquipment,
        string SpellcastingNotes,
        string Notes);

    public sealed record GenerateSpeciesDraftRequest(
        string? GenerationBrief,
        string? NameHint,
        string? OriginHint,
        string? CultureHint,
        string? TraitHint,
        string? NotesHint,
        IReadOnlyList<string>? ExistingSpeciesNames);

    public sealed record GenerateSpeciesDraftResponse(
        string Name,
        string Summary,
        string Size,
        string Speed,
        string CreatureType,
        List<string> Languages,
        List<GenerateSpeciesTraitResponse> Traits,
        string Notes);

    public sealed record GenerateFeatureEffectResponse(
        string Type,
        string Target,
        int Value,
        string Scaling,
        List<string> TargetOptions);

    public sealed record GenerateClassFeatureResponse(
        int Level,
        string Name,
        string Description,
        List<GenerateFeatureEffectResponse> Effects);

    public sealed record GenerateSpeciesTraitResponse(
        string Name,
        string Description,
        int ChoiceCount,
        List<string> ChoiceOptions,
        List<GenerateFeatureEffectResponse> Effects);

    public sealed record GenerateMonsterDraftResponse(
        string Name,
        string ChallengeRating,
        string CreatureType,
        string CreatureCategory,
        string Size,
        int? ArmorClass,
        int? HitPoints,
        string Speed,
        string Alignment,
        bool Legendary,
        string SourceLabel,
        GenerateMonsterAbilityScoresResponse AbilityScores,
        string SavingThrows,
        string Skills,
        string DamageVulnerabilities,
        string DamageResistances,
        string DamageImmunities,
        string ConditionImmunities,
        string Senses,
        string Languages,
        string ChallengeXp,
        List<GenerateMonsterTextEntryResponse> Traits,
        List<GenerateMonsterTextEntryResponse> Actions,
        List<GenerateMonsterTextEntryResponse> Reactions,
        List<GenerateMonsterTextEntryResponse> LegendaryActions,
        string Notes);

    public sealed record GenerateMonsterAbilityScoresResponse(
        int Strength,
        int Dexterity,
        int Constitution,
        int Intelligence,
        int Wisdom,
        int Charisma);

    public sealed record GenerateMonsterTextEntryResponse(string Name, string Description);

    private sealed record GenerateMonsterDraftPayload(
        string? Name,
        string? ChallengeRating,
        string? CreatureType,
        string? CreatureCategory,
        string? Size,
        int? ArmorClass,
        int? HitPoints,
        string? Speed,
        string? Alignment,
        bool? Legendary,
        string? SourceLabel,
        GenerateMonsterAbilityScoresPayload? AbilityScores,
        string? SavingThrows,
        string? Skills,
        string? DamageVulnerabilities,
        string? DamageResistances,
        string? DamageImmunities,
        string? ConditionImmunities,
        string? Senses,
        string? Languages,
        string? ChallengeXp,
        List<GenerateMonsterTextEntryPayload>? Traits,
        List<GenerateMonsterTextEntryPayload>? Actions,
        List<GenerateMonsterTextEntryPayload>? Reactions,
        List<GenerateMonsterTextEntryPayload>? LegendaryActions,
        string? Notes);

    private sealed record GenerateClassDraftPayload(
        string? Name,
        string? Summary,
        string? HitDie,
        string? PrimaryAbility,
        string? SavingThrows,
        string? ArmorTraining,
        string? WeaponTraining,
        string? ToolTraining,
        List<string>? KeyFeatures,
        List<GenerateClassFeaturePayload>? Features,
        List<string>? StartingEquipment,
        string? SpellcastingNotes,
        string? Notes);

    private sealed record GenerateSpeciesDraftPayload(
        string? Name,
        string? Summary,
        string? Size,
        string? Speed,
        string? CreatureType,
        List<string>? Languages,
        List<GenerateSpeciesTraitPayload>? Traits,
        string? Notes);

    private sealed record GenerateFeatureEffectPayload(
        string? Type,
        string? Target,
        int? Value,
        string? Scaling,
        List<string>? TargetOptions);

    private sealed record GenerateClassFeaturePayload(
        int? Level,
        string? Name,
        string? Description,
        List<GenerateFeatureEffectPayload>? Effects);

    private sealed record GenerateSpeciesTraitPayload(
        string? Name,
        string? Description,
        int? ChoiceCount,
        List<string>? ChoiceOptions,
        List<GenerateFeatureEffectPayload>? Effects);

    private sealed record GenerateMonsterAbilityScoresPayload(
        int? Strength,
        int? Dexterity,
        int? Constitution,
        int? Intelligence,
        int? Wisdom,
        int? Charisma);

    private sealed record GenerateMonsterTextEntryPayload(string? Name, string? Description);

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
