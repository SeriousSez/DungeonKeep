using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DungeonKeep.ApplicationService.Services;

public sealed class CampaignService(
    ICampaignRepository campaignRepository,
    ICharacterRepository characterRepository,
    ICampaignInviteEmailService campaignInviteEmailService,
    ILogger<CampaignService> logger) : ICampaignService
{
    private static readonly CampaignThreadDto[] DefaultOpenThreads =
    [
        new(Guid.NewGuid(), "Define the inciting incident for the first session.", "Party")
    ];
    private static readonly CampaignSessionDto[] DefaultSessions = [];
    private static readonly string[] DefaultNpcs = [];
    private static readonly string[] DefaultLoot = [];
    private static readonly CampaignWorldNoteDto[] DefaultWorldNotes = [];
    private static readonly CampaignMapDto DefaultCampaignMap = new("Parchment", string.Empty, [], [], [], [], [], new CampaignMapLayersDto([], [], []));
    private static readonly CampaignMapBoardDto DefaultCampaignMapBoard = new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Main Map", "Parchment", string.Empty, [], [], [], [], [], new CampaignMapLayersDto([], [], []));

    public async Task<IReadOnlyList<CampaignDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var campaigns = await campaignRepository.GetAllForUserAsync(userId, cancellationToken);
        return campaigns
            .Select(campaign => MapCampaign(campaign, userId))
            .ToList();
    }

    public async Task<CampaignDto> CreateAsync(CreateCampaignRequest request, AuthenticatedUser owner, CancellationToken cancellationToken = default)
    {
        var levelStart = Math.Clamp(request.LevelStart, 1, 20);
        var levelEnd = Math.Clamp(request.LevelEnd, levelStart, 20);

        var campaign = new Campaign
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Setting = request.Setting.Trim(),
            Tone = string.IsNullOrWhiteSpace(request.Tone) ? "Heroic" : request.Tone.Trim(),
            LevelStart = levelStart,
            LevelEnd = levelEnd,
            Hook = request.Hook.Trim(),
            NextSession = request.NextSession.Trim(),
            Summary = request.Summary.Trim(),
            SessionsJson = SerializeSessions(DefaultSessions),
            NpcsJson = SerializeNamedItems(DefaultNpcs),
            LootJson = SerializeNamedItems(DefaultLoot),
            OpenThreadsJson = SerializeThreads(DefaultOpenThreads),
            WorldNotesJson = SerializeWorldNotes(DefaultWorldNotes),
            CampaignMapJson = SerializeCampaignMapLibrary(new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [DefaultCampaignMapBoard])),
            CreatedAtUtc = DateTime.UtcNow,
            Memberships =
            [
                new CampaignMembership
                {
                    Id = Guid.NewGuid(),
                    UserId = owner.Id,
                    Email = owner.Email,
                    Role = "Owner",
                    Status = "Active",
                    CreatedAtUtc = DateTime.UtcNow
                }
            ]
        };

        var saved = await campaignRepository.AddAsync(campaign, cancellationToken);
        return MapCampaign(saved, owner.Id);
    }

    public async Task<CampaignDto?> UpdateAsync(Guid campaignId, UpdateCampaignRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Setting) || string.IsNullOrWhiteSpace(request.Hook))
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can update campaigns.");
        }

        var levelStart = Math.Clamp(request.LevelStart, 1, 20);
        var levelEnd = Math.Clamp(request.LevelEnd, levelStart, 20);

        var updated = await campaignRepository.UpdateAsync(
            campaignId,
            request.Name.Trim(),
            request.Setting.Trim(),
            string.IsNullOrWhiteSpace(request.Tone) ? "Heroic" : request.Tone.Trim(),
            levelStart,
            levelEnd,
            request.Hook.Trim(),
            request.NextSession.Trim(),
            request.Summary.Trim(),
            cancellationToken
        );

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> AddSessionAsync(Guid campaignId, CreateCampaignSessionRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Title))
        {
            return null;
        }

        var updated = await campaignRepository.AddSessionAsync(
            campaignId,
            new CampaignSessionDto(Guid.NewGuid(), request.Title.Trim(), request.Date.Trim(), request.Location.Trim(), request.Objective.Trim(), NormalizeThreat(request.Threat)),
            cancellationToken);

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> UpdateSessionAsync(Guid campaignId, Guid sessionId, UpdateCampaignSessionRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || sessionId == Guid.Empty || string.IsNullOrWhiteSpace(request.Title))
        {
            return null;
        }

        var updated = await campaignRepository.UpdateSessionAsync(
            campaignId,
            new CampaignSessionDto(sessionId, request.Title.Trim(), request.Date.Trim(), request.Location.Trim(), request.Objective.Trim(), NormalizeThreat(request.Threat)),
            cancellationToken);

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> RemoveSessionAsync(Guid campaignId, Guid sessionId, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || sessionId == Guid.Empty)
        {
            return null;
        }

        var updated = await campaignRepository.RemoveSessionAsync(campaignId, sessionId, cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> AddNpcAsync(Guid campaignId, CreateCampaignNpcRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return null;
        }

        var updated = await campaignRepository.AddNpcAsync(campaignId, request.Name.Trim(), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> RemoveNpcAsync(Guid campaignId, RemoveCampaignNpcRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return null;
        }

        var updated = await campaignRepository.RemoveNpcAsync(campaignId, request.Name.Trim(), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> AddLootAsync(Guid campaignId, CreateCampaignLootRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return null;
        }

        var updated = await campaignRepository.AddLootAsync(campaignId, request.Name.Trim(), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> RemoveLootAsync(Guid campaignId, RemoveCampaignLootRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Name))
        {
            return null;
        }

        var updated = await campaignRepository.RemoveLootAsync(campaignId, request.Name.Trim(), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> AddThreadAsync(Guid campaignId, CreateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Text))
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can add threads.");
        }

        var updated = await campaignRepository.AddThreadAsync(
            campaignId,
            Guid.NewGuid(),
            request.Text.Trim(),
            NormalizeVisibility(request.Visibility),
            cancellationToken
        );

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> UpdateThreadAsync(Guid campaignId, Guid threadId, UpdateCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (threadId == Guid.Empty || string.IsNullOrWhiteSpace(request.Text))
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can update threads.");
        }

        var updated = await campaignRepository.UpdateThreadAsync(
            campaignId,
            threadId,
            request.Text.Trim(),
            NormalizeVisibility(request.Visibility),
            cancellationToken
        );

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> ArchiveThreadAsync(Guid campaignId, ArchiveCampaignThreadRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.ThreadId == Guid.Empty)
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can archive threads.");
        }

        var updated = await campaignRepository.ArchiveThreadAsync(campaignId, request.ThreadId, cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> AddWorldNoteAsync(Guid campaignId, CreateCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return null;
        }

        var updated = await campaignRepository.AddWorldNoteAsync(
            campaignId,
            new CampaignWorldNoteDto(Guid.NewGuid(), request.Title.Trim(), NormalizeWorldNoteCategory(request.Category), request.Content.Trim()),
            cancellationToken);

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> UpdateWorldNoteAsync(Guid campaignId, Guid noteId, UpdateCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || noteId == Guid.Empty || string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Content))
        {
            return null;
        }

        var updated = await campaignRepository.UpdateWorldNoteAsync(
            campaignId,
            new CampaignWorldNoteDto(noteId, request.Title.Trim(), NormalizeWorldNoteCategory(request.Category), request.Content.Trim()),
            cancellationToken);

        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> DeleteWorldNoteAsync(Guid campaignId, DeleteCampaignWorldNoteRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null || request.NoteId == Guid.Empty)
        {
            return null;
        }

        var updated = await campaignRepository.RemoveWorldNoteAsync(campaignId, request.NoteId, cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> UpdateMapAsync(Guid campaignId, UpdateCampaignMapRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var library = request.Library is not null
            ? NormalizeCampaignMapLibrary(request.Library)
            : request.Map is not null
                ? NormalizeCampaignMapLibrary(new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [new CampaignMapBoardDto(
                    DefaultCampaignMapBoard.Id,
                    DefaultCampaignMapBoard.Name,
                    request.Map.Background,
                    request.Map.BackgroundImageUrl,
                    request.Map.Strokes,
                    request.Map.Icons,
                    request.Map.Tokens,
                    request.Map.Decorations,
                    request.Map.Labels,
                    request.Map.Layers)]))
                : null;

        if (library is null)
        {
            return null;
        }

        var updated = await campaignRepository.UpdateMapAsync(campaignId, library, cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> InviteMemberAsync(Guid campaignId, InviteCampaignMemberRequest request, AuthenticatedUser user, string? clientBaseUrl, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return null;
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == user.Id && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can invite members.");
        }

        var existingMembership = campaign.Memberships.FirstOrDefault(member => member.Email == normalizedEmail);
        if (existingMembership is not null)
        {
            return MapCampaign(campaign, user.Id);
        }

        var updated = await campaignRepository.InviteMemberAsync(campaignId, normalizedEmail, user, cancellationToken);
        if (updated is null)
        {
            return null;
        }

        var invitedMembership = updated.Memberships.FirstOrDefault(member => member.Email == normalizedEmail);

        try
        {
            var campaignUrl = BuildCampaignUrl(clientBaseUrl, updated.Id);

            await campaignInviteEmailService.SendInvitationAsync(
                new CampaignInvitationEmail(
                    updated.Id,
                    updated.Name,
                    campaignUrl,
                    normalizedEmail,
                    user.DisplayName,
                    user.Email,
                    invitedMembership?.Status == "Active"),
                cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Failed to send campaign invite email for campaign {CampaignId} to {RecipientEmail}.",
                updated.Id,
                normalizedEmail);
        }

        return MapCampaign(updated, user.Id);
    }

    public async Task LeaveAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            throw new InvalidOperationException("Campaign not found.");
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null)
        {
            throw new UnauthorizedAccessException("You are not a member of this campaign.");
        }

        if (membership.Role == "Owner")
        {
            throw new InvalidOperationException("Campaign owners cannot leave their own campaign.");
        }

        await characterRepository.UnassignOwnedByUserInCampaignAsync(campaignId, userId, cancellationToken);
        await campaignRepository.RemoveMemberAsync(campaignId, userId, cancellationToken);
    }

    private static string BuildCampaignUrl(string? clientBaseUrl, Guid campaignId)
    {
        var normalizedBaseUrl = string.IsNullOrWhiteSpace(clientBaseUrl)
            ? "http://localhost:4200"
            : clientBaseUrl.Trim().TrimEnd('/');

        return $"{normalizedBaseUrl}/campaigns/{campaignId}";
    }

    public async Task DeleteAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            throw new InvalidOperationException("Campaign not found.");
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can delete campaigns.");
        }

        await campaignRepository.DeleteAsync(campaignId, cancellationToken);
    }

    private async Task<Campaign?> RequireOwnerCampaignAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null || membership.Role != "Owner")
        {
            throw new UnauthorizedAccessException("Only campaign owners can manage campaign content.");
        }

        return campaign;
    }

    private static CampaignDto MapCampaign(Campaign campaign, Guid userId)
    {
        var currentUserRole = campaign.Memberships
            .FirstOrDefault(member => member.UserId == userId && member.Status == "Active")
            ?.Role ?? "Member";

        var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var activeMap = library.Maps.FirstOrDefault(map => map.Id == library.ActiveMapId) ?? library.Maps[0];

        return new CampaignDto(
            campaign.Id,
            campaign.Name,
            campaign.Setting,
            campaign.Tone,
            Math.Clamp(campaign.LevelStart, 1, 20),
            Math.Clamp(campaign.LevelEnd, Math.Clamp(campaign.LevelStart, 1, 20), 20),
            campaign.Hook,
            campaign.NextSession,
            campaign.Summary,
            campaign.CreatedAtUtc,
            campaign.Characters.Count,
            ParseSessions(campaign.SessionsJson),
            ParseNamedItems(campaign.NpcsJson),
            ParseNamedItems(campaign.LootJson),
            ParseOpenThreads(campaign.OpenThreadsJson),
            ParseWorldNotes(campaign.WorldNotesJson),
            new CampaignMapDto(activeMap.Background, activeMap.BackgroundImageUrl, activeMap.Strokes, activeMap.Icons, activeMap.Tokens, activeMap.Decorations, activeMap.Labels, activeMap.Layers),
            library.Maps,
            activeMap.Id,
            currentUserRole,
            campaign.Memberships
                .OrderBy(member => member.Status == "Active" ? 0 : 1)
                .ThenBy(member => member.Role == "Owner" ? 0 : 1)
                .ThenBy(member => member.DisplayLabel())
                .Select(member => new CampaignMemberDto(
                    member.UserId,
                    member.Email,
                    member.DisplayLabel(),
                    member.Role,
                    member.Status
                ))
                .ToList()
        );
    }

    private static IReadOnlyList<CampaignSessionDto> ParseSessions(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return DefaultSessions;
        }

        try
        {
            var sessions = JsonSerializer.Deserialize<List<CampaignSessionDto>>(json);
            if (sessions is { Count: > 0 })
            {
                return sessions
                    .Where(session => !string.IsNullOrWhiteSpace(session.Title))
                    .Select(session => new CampaignSessionDto(
                        session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
                        session.Title.Trim(),
                        session.Date.Trim(),
                        session.Location.Trim(),
                        session.Objective.Trim(),
                        NormalizeThreat(session.Threat)))
                    .ToList();
            }
        }
        catch
        {
        }

        return DefaultSessions;
    }

    private static IReadOnlyList<string> ParseNamedItems(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<List<string>>(json) ?? [])
                .Where(item => !string.IsNullOrWhiteSpace(item))
                .Select(item => item.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static IReadOnlyList<CampaignThreadDto> ParseOpenThreads(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return DefaultOpenThreads;
        }

        try
        {
            var threads = JsonSerializer.Deserialize<List<CampaignThreadDto>>(json);
            if (threads is { Count: > 0 })
            {
                return threads
                    .Where(thread => !string.IsNullOrWhiteSpace(thread.Text))
                    .Select(thread => new CampaignThreadDto(
                        thread.Id == Guid.Empty ? Guid.NewGuid() : thread.Id,
                        thread.Text.Trim(),
                        NormalizeVisibility(thread.Visibility)))
                    .ToList();
            }

            var legacyThreads = JsonSerializer.Deserialize<List<string>>(json) ?? [];
            return legacyThreads
                .Where(thread => !string.IsNullOrWhiteSpace(thread))
                .Select(thread => new CampaignThreadDto(Guid.NewGuid(), thread.Trim(), "Party"))
                .ToList();
        }
        catch
        {
            return DefaultOpenThreads;
        }
    }

    private static IReadOnlyList<CampaignWorldNoteDto> ParseWorldNotes(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return DefaultWorldNotes;
        }

        try
        {
            var notes = JsonSerializer.Deserialize<List<CampaignWorldNoteDto>>(json);
            if (notes is { Count: > 0 })
            {
                return notes
                    .Where(note => !string.IsNullOrWhiteSpace(note.Title) && !string.IsNullOrWhiteSpace(note.Content))
                    .Select(note => new CampaignWorldNoteDto(
                        note.Id == Guid.Empty ? Guid.NewGuid() : note.Id,
                        note.Title.Trim(),
                        NormalizeWorldNoteCategory(note.Category),
                        note.Content.Trim()))
                    .ToList();
            }
        }
        catch
        {
        }

        return DefaultWorldNotes;
    }

    private static CampaignMapLibraryDto ParseCampaignMapLibrary(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [DefaultCampaignMapBoard]);
        }

        try
        {
            var library = JsonSerializer.Deserialize<CampaignMapLibraryDto>(json);
            if (library is not null)
            {
                return NormalizeCampaignMapLibrary(library);
            }
        }
        catch
        {
        }

        try
        {
            var legacyMap = JsonSerializer.Deserialize<CampaignMapDto>(json);
            if (legacyMap is not null)
            {
                return NormalizeCampaignMapLibrary(new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [new CampaignMapBoardDto(
                    DefaultCampaignMapBoard.Id,
                    DefaultCampaignMapBoard.Name,
                    legacyMap.Background,
                    legacyMap.BackgroundImageUrl,
                    legacyMap.Strokes,
                    legacyMap.Icons,
                    legacyMap.Tokens,
                    legacyMap.Decorations,
                    legacyMap.Labels,
                    legacyMap.Layers)]));
            }
        }
        catch
        {
        }

        return new CampaignMapLibraryDto(DefaultCampaignMapBoard.Id, [DefaultCampaignMapBoard]);
    }

    private static string SerializeThreads(IEnumerable<CampaignThreadDto> threads)
    {
        return JsonSerializer.Serialize(threads.Select(thread => new CampaignThreadDto(
            thread.Id == Guid.Empty ? Guid.NewGuid() : thread.Id,
            thread.Text.Trim(),
            NormalizeVisibility(thread.Visibility))));
    }

    private static string SerializeSessions(IEnumerable<CampaignSessionDto> sessions)
    {
        return JsonSerializer.Serialize(sessions.Select(session => new CampaignSessionDto(
            session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
            session.Title.Trim(),
            session.Date.Trim(),
            session.Location.Trim(),
            session.Objective.Trim(),
            NormalizeThreat(session.Threat))));
    }

    private static string SerializeWorldNotes(IEnumerable<CampaignWorldNoteDto> notes)
    {
        return JsonSerializer.Serialize(notes
            .Where(note => !string.IsNullOrWhiteSpace(note.Title) && !string.IsNullOrWhiteSpace(note.Content))
            .Select(note => new CampaignWorldNoteDto(
                note.Id == Guid.Empty ? Guid.NewGuid() : note.Id,
                note.Title.Trim(),
                NormalizeWorldNoteCategory(note.Category),
                note.Content.Trim())));
    }

    private static string SerializeCampaignMapLibrary(CampaignMapLibraryDto library)
    {
        return JsonSerializer.Serialize(NormalizeCampaignMapLibrary(library));
    }

    private static string SerializeNamedItems(IEnumerable<string> items)
    {
        return JsonSerializer.Serialize(items
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));
    }

    private static string NormalizeWorldNoteCategory(string? category)
    {
        return category?.Trim() switch
        {
            "Backstory" => "Backstory",
            "Organization" => "Organization",
            "Ally" => "Ally",
            "Enemy" => "Enemy",
            "Location" => "Location",
            "Lore" => "Lore",
            "Custom" => "Custom",
            _ => "Lore"
        };
    }

    private static CampaignMapDto NormalizeCampaignMap(CampaignMapDto map)
    {
        var normalizedStrokes = (map.Strokes ?? [])
            .Where(stroke => stroke.Points is { Count: > 0 })
            .Select(stroke => new CampaignMapStrokeDto(
                stroke.Id == Guid.Empty ? Guid.NewGuid() : stroke.Id,
                NormalizeMapColor(stroke.Color),
                Math.Clamp(stroke.Width, 2, 18),
                NormalizeMapPoints(stroke.Points)))
            .Where(stroke => stroke.Points.Count > 0)
            .ToList();

        var normalizedIcons = (map.Icons ?? [])
            .Select(icon => new CampaignMapIconDto(
                icon.Id == Guid.Empty ? Guid.NewGuid() : icon.Id,
                NormalizeMapIconType(icon.Type),
                string.IsNullOrWhiteSpace(icon.Label) ? DefaultMapIconLabel(icon.Type) : icon.Label.Trim(),
                ClampMapCoordinate(icon.X),
                ClampMapCoordinate(icon.Y)))
            .ToList();

        var normalizedTokens = (map.Tokens ?? [])
            .Where(token => !string.IsNullOrWhiteSpace(token.ImageUrl))
            .Select(token => new CampaignMapTokenDto(
                token.Id == Guid.Empty ? Guid.NewGuid() : token.Id,
                string.IsNullOrWhiteSpace(token.Name) ? "Token" : token.Name.Trim(),
                NormalizeMapBackgroundImageUrl(token.ImageUrl),
                ClampMapCoordinate(token.X),
                ClampMapCoordinate(token.Y),
                ClampMapScale(token.Size),
                token.Note?.Trim() ?? string.Empty))
            .ToList();

        var normalizedDecorations = (map.Decorations ?? [])
            .Select(decoration => new CampaignMapDecorationDto(
                decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                NormalizeMapDecorationType(decoration.Type),
                NormalizeMapDecorationColor(decoration.Type, decoration.Color),
                ClampMapCoordinate(decoration.X),
                ClampMapCoordinate(decoration.Y),
                ClampMapScale(decoration.Scale),
                ClampMapRotation(decoration.Rotation),
                ClampMapOpacity(decoration.Opacity)))
            .ToList();

        var normalizedLabels = (map.Labels ?? [])
            .Where(label => !string.IsNullOrWhiteSpace(label.Text))
            .Select(label => new CampaignMapLabelDto(
                label.Id == Guid.Empty ? Guid.NewGuid() : label.Id,
                label.Text.Trim(),
                NormalizeMapLabelTone(label.Tone),
                ClampMapCoordinate(label.X),
                ClampMapCoordinate(label.Y),
                ClampMapRotation(label.Rotation)))
            .ToList();

        var normalizedLayers = new CampaignMapLayersDto(
            NormalizeMapStrokeCollection(map.Layers?.Rivers),
            NormalizeMapDecorationCollection(map.Layers?.MountainChains),
            NormalizeMapDecorationCollection(map.Layers?.ForestBelts));

        return new CampaignMapDto(
            NormalizeMapBackground(map.Background),
            NormalizeMapBackgroundImageUrl(map.BackgroundImageUrl),
            normalizedStrokes,
            normalizedIcons,
            normalizedTokens,
            normalizedDecorations,
            normalizedLabels,
            normalizedLayers);
    }

    private static CampaignMapBoardDto NormalizeCampaignMapBoard(CampaignMapBoardDto map)
    {
        var normalized = NormalizeCampaignMap(new CampaignMapDto(
            map.Background,
            map.BackgroundImageUrl,
            map.Strokes,
            map.Icons,
            map.Tokens,
            map.Decorations,
            map.Labels,
            map.Layers));

        return new CampaignMapBoardDto(
            map.Id == Guid.Empty ? Guid.NewGuid() : map.Id,
            string.IsNullOrWhiteSpace(map.Name) ? "Untitled Map" : map.Name.Trim(),
            normalized.Background,
            normalized.BackgroundImageUrl,
            normalized.Strokes,
            normalized.Icons,
            normalized.Tokens,
            normalized.Decorations,
            normalized.Labels,
            normalized.Layers);
    }

    private static CampaignMapLibraryDto NormalizeCampaignMapLibrary(CampaignMapLibraryDto library)
    {
        var maps = (library.Maps ?? [])
            .Select(NormalizeCampaignMapBoard)
            .DistinctBy(map => map.Id)
            .ToList();

        if (maps.Count == 0)
        {
            maps.Add(new CampaignMapBoardDto(
                DefaultCampaignMapBoard.Id,
                DefaultCampaignMapBoard.Name,
                DefaultCampaignMapBoard.Background,
                DefaultCampaignMapBoard.BackgroundImageUrl,
                DefaultCampaignMapBoard.Strokes,
                DefaultCampaignMapBoard.Icons,
                DefaultCampaignMapBoard.Tokens,
                DefaultCampaignMapBoard.Decorations,
                DefaultCampaignMapBoard.Labels,
                DefaultCampaignMapBoard.Layers));
        }

        var activeMapId = library.ActiveMapId != Guid.Empty && maps.Any(map => map.Id == library.ActiveMapId)
            ? library.ActiveMapId
            : maps[0].Id;

        return new CampaignMapLibraryDto(activeMapId, maps);
    }

    private static IReadOnlyList<CampaignMapPointDto> NormalizeMapPoints(IReadOnlyList<CampaignMapPointDto> points)
    {
        return points
            .Select(point => new CampaignMapPointDto(ClampMapCoordinate(point.X), ClampMapCoordinate(point.Y)))
            .Distinct()
            .ToList();
    }

    private static IReadOnlyList<CampaignMapStrokeDto> NormalizeMapStrokeCollection(IReadOnlyList<CampaignMapStrokeDto>? strokes)
    {
        return (strokes ?? [])
            .Where(stroke => stroke.Points is { Count: > 0 })
            .Select(stroke => new CampaignMapStrokeDto(
                stroke.Id == Guid.Empty ? Guid.NewGuid() : stroke.Id,
                NormalizeMapColor(stroke.Color),
                Math.Clamp(stroke.Width, 2, 18),
                NormalizeMapPoints(stroke.Points)))
            .Where(stroke => stroke.Points.Count > 0)
            .ToList();
    }

    private static IReadOnlyList<CampaignMapDecorationDto> NormalizeMapDecorationCollection(IReadOnlyList<CampaignMapDecorationDto>? decorations)
    {
        return (decorations ?? [])
            .Select(decoration => new CampaignMapDecorationDto(
                decoration.Id == Guid.Empty ? Guid.NewGuid() : decoration.Id,
                NormalizeMapDecorationType(decoration.Type),
                NormalizeMapDecorationColor(decoration.Type, decoration.Color),
                ClampMapCoordinate(decoration.X),
                ClampMapCoordinate(decoration.Y),
                ClampMapScale(decoration.Scale),
                ClampMapRotation(decoration.Rotation),
                ClampMapOpacity(decoration.Opacity)))
            .ToList();
    }

    private static double ClampMapCoordinate(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0.5d;
        }

        return Math.Clamp(value, 0d, 1d);
    }

    private static string NormalizeMapBackground(string? background)
    {
        return background?.Trim() switch
        {
            "Cavern" => "Cavern",
            "Coast" => "Coast",
            "City" => "City",
            _ => "Parchment"
        };
    }

    private static string NormalizeMapBackgroundImageUrl(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static string NormalizeMapIconType(string? iconType)
    {
        return iconType?.Trim() switch
        {
            "Town" => "Town",
            "Camp" => "Camp",
            "Dungeon" => "Dungeon",
            "Danger" => "Danger",
            "Treasure" => "Treasure",
            "Portal" => "Portal",
            "Tower" => "Tower",
            _ => "Keep"
        };
    }

    private static string NormalizeMapDecorationType(string? decorationType)
    {
        return decorationType?.Trim() switch
        {
            "Mountain" => "Mountain",
            "Hill" => "Hill",
            "Reef" => "Reef",
            "Cave" => "Cave",
            "Ward" => "Ward",
            _ => "Forest"
        };
    }

    private static string NormalizeMapLabelTone(string? tone)
    {
        return tone?.Trim() switch
        {
            "Feature" => "Feature",
            _ => "Region"
        };
    }

    private static string DefaultMapIconLabel(string? iconType)
    {
        return NormalizeMapIconType(iconType) switch
        {
            "Town" => "Town",
            "Camp" => "Camp",
            "Dungeon" => "Dungeon",
            "Danger" => "Hazard",
            "Treasure" => "Cache",
            "Portal" => "Gate",
            "Tower" => "Tower",
            _ => "Keep"
        };
    }

    private static string NormalizeMapColor(string? color)
    {
        return color?.Trim() switch
        {
            "#4b3a2a" => "#4b3a2a",
            "#8a5a2b" => "#8a5a2b",
            "#507255" => "#507255",
            "#385f7a" => "#385f7a",
            "#a03d2f" => "#a03d2f",
            _ => "#8a5a2b"
        };
    }

    private static string NormalizeMapDecorationColor(string? decorationType, string? color)
    {
        return color?.Trim() switch
        {
            "#4b3a2a" => "#4b3a2a",
            "#8a5a2b" => "#8a5a2b",
            "#507255" => "#507255",
            "#385f7a" => "#385f7a",
            "#a03d2f" => "#a03d2f",
            _ => NormalizeMapDecorationType(decorationType) switch
            {
                "Mountain" => "#4b3a2a",
                "Forest" => "#507255",
                "Reef" => "#385f7a",
                "Ward" => "#a03d2f",
                _ => "#8a5a2b"
            }
        };
    }

    private static double ClampMapScale(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 1d;
        }

        return Math.Clamp(value, 0.55d, 1.8d);
    }

    private static double ClampMapRotation(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0d;
        }

        return Math.Clamp(value, -180d, 180d);
    }

    private static double ClampMapOpacity(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 0.75d;
        }

        return Math.Clamp(value, 0.24d, 1d);
    }

    private static string NormalizeThreat(string? threat)
    {
        return threat?.Trim() switch
        {
            "Low" => "Low",
            "Moderate" => "Moderate",
            "High" => "High",
            "Deadly" => "Deadly",
            _ => "Moderate"
        };
    }

    private static string NormalizeVisibility(string? visibility)
    {
        if (string.Equals(visibility, "GMOnly", StringComparison.OrdinalIgnoreCase))
        {
            return "GMOnly";
        }

        return "Party";
    }
}

file static class CampaignMembershipExtensions
{
    public static string DisplayLabel(this CampaignMembership membership)
    {
        return string.IsNullOrWhiteSpace(membership.User?.DisplayName)
            ? membership.Email
            : membership.User.DisplayName;
    }
}
