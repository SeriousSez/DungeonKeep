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
    private const double DefaultMapGridColumns = 25d;
    private const double DefaultMapGridRows = 17.5d;
    private const string DefaultMapGridColor = "#745338";
    private const double DefaultMapGridOffsetX = 0d;
    private const double DefaultMapGridOffsetY = 0d;
    private static readonly CampaignMapDto DefaultCampaignMap = new("Parchment", string.Empty, DefaultMapGridColumns, DefaultMapGridRows, DefaultMapGridColor, DefaultMapGridOffsetX, DefaultMapGridOffsetY, [], [], [], [], [], [], new CampaignMapLayersDto([], [], []), []);
    private static readonly CampaignMapBoardDto DefaultCampaignMapBoard = new(Guid.Parse("11111111-1111-1111-1111-111111111111"), "Main Map", "Parchment", string.Empty, DefaultMapGridColumns, DefaultMapGridRows, DefaultMapGridColor, DefaultMapGridOffsetX, DefaultMapGridOffsetY, [], [], [], [], [], [], new CampaignMapLayersDto([], [], []), []);

    public async Task<IReadOnlyList<CampaignSummaryDto>> GetAllSummariesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var campaigns = await campaignRepository.GetAllSummariesForUserAsync(userId, cancellationToken);
        return campaigns
            .Select(MapCampaignSummary)
            .ToList();
    }

    public async Task<IReadOnlyList<CampaignDto>> GetAllAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var campaigns = await campaignRepository.GetAllForUserAsync(userId, cancellationToken);
        return campaigns
            .Select(campaign => MapCampaign(campaign, userId))
            .ToList();
    }

    public async Task<CampaignDto?> GetByIdAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        return membership is null ? null : MapCampaign(campaign, userId);
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
                    request.Map.GridColumns,
                    request.Map.GridRows,
                    request.Map.GridColor,
                    request.Map.GridOffsetX,
                    request.Map.GridOffsetY,
                    request.Map.Strokes,
                    request.Map.Walls,
                    request.Map.Icons,
                    request.Map.Tokens,
                    request.Map.Decorations,
                    request.Map.Labels,
                    request.Map.Layers,
                    request.Map.VisionMemory)]))
                : null;

        if (library is null)
        {
            return null;
        }

        var existingLibrary = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var existingVisionByMapId = existingLibrary.Maps.ToDictionary(map => map.Id, map => map.VisionMemory);
        library = new CampaignMapLibraryDto(
            library.ActiveMapId,
            library.Maps.Select(map => map with
            {
                VisionMemory = existingVisionByMapId.TryGetValue(map.Id, out var visionMemory)
                    ? visionMemory
                    : map.VisionMemory
            }).ToList());

        var updated = await campaignRepository.UpdateMapAsync(campaignId, library, cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<CampaignDto?> MoveMapTokenAsync(Guid campaignId, Guid tokenId, MoveCampaignMapTokenRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (tokenId == Guid.Empty || request.MapId == Guid.Empty)
        {
            return null;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null)
        {
            throw new UnauthorizedAccessException("You are not a member of this campaign.");
        }

        var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var activeMap = library.Maps.FirstOrDefault(map => map.Id == library.ActiveMapId) ?? library.Maps[0];
        var targetMap = library.Maps.FirstOrDefault(map => map.Id == request.MapId);
        if (targetMap is null)
        {
            return null;
        }

        if (membership.Role != "Owner" && targetMap.Id != activeMap.Id)
        {
            throw new UnauthorizedAccessException("Members can only interact with the active map.");
        }

        var token = targetMap.Tokens.FirstOrDefault(entry => entry.Id == tokenId);
        if (token is null)
        {
            return null;
        }

        if (membership.Role != "Owner" && !await CanUserControlTokenAsync(token, userId, cancellationToken))
        {
            throw new UnauthorizedAccessException("You cannot control this token.");
        }

        var latestCampaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (latestCampaign is null)
        {
            return null;
        }

        var latestLibrary = ParseCampaignMapLibrary(latestCampaign.CampaignMapJson);
        var latestTargetMap = latestLibrary.Maps.FirstOrDefault(map => map.Id == request.MapId);
        if (latestTargetMap is null)
        {
            return null;
        }

        var latestToken = latestTargetMap.Tokens.FirstOrDefault(entry => entry.Id == tokenId);
        if (latestToken is null)
        {
            return null;
        }

        CampaignMapVisionMemoryDto? normalizedVisionMemory = null;
        if (request.VisionMemory is not null)
        {
            normalizedVisionMemory = NormalizeMapVisionMemory(request.VisionMemory with
            {
                Key = BuildVisionMemoryKey(latestToken)
            });
        }

        var updatedMaps = latestLibrary.Maps
            .Select(map => map.Id == latestTargetMap.Id
                ? map with
                {
                    Tokens = map.Tokens
                        .Select(entry => entry.Id == tokenId
                            ? entry with
                            {
                                X = ClampMapCoordinate(request.X),
                                Y = ClampMapCoordinate(request.Y)
                            }
                            : entry)
                        .ToList(),
                    VisionMemory = normalizedVisionMemory is null
                        ? map.VisionMemory
                        : map.VisionMemory
                            .Where(entry => !string.Equals(entry.Key, normalizedVisionMemory.Key, StringComparison.OrdinalIgnoreCase))
                            .Append(normalizedVisionMemory)
                            .ToList()
                }
                : map)
            .ToList();

        var updated = await campaignRepository.UpdateMapAsync(campaignId, new CampaignMapLibraryDto(latestLibrary.ActiveMapId, updatedMaps), cancellationToken);
        return updated is null ? null : MapCampaign(updated, userId);
    }

    public async Task<bool?> UpdateMapVisionAsync(Guid campaignId, UpdateCampaignMapVisionRequest request, Guid userId, CancellationToken cancellationToken = default)
    {
        if (request.MapId == Guid.Empty || request.Memory is null)
        {
            return false;
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var membership = campaign.Memberships.FirstOrDefault(member => member.UserId == userId && member.Status == "Active");
        if (membership is null)
        {
            throw new UnauthorizedAccessException("You are not a member of this campaign.");
        }

        var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var activeMap = library.Maps.FirstOrDefault(map => map.Id == library.ActiveMapId) ?? library.Maps[0];
        var targetMap = library.Maps.FirstOrDefault(map => map.Id == request.MapId);
        if (targetMap is null)
        {
            return null;
        }

        if (membership.Role != "Owner" && targetMap.Id != activeMap.Id)
        {
            throw new UnauthorizedAccessException("Members can only remember sight on the active map.");
        }

        var normalizedMemory = NormalizeMapVisionMemory(request.Memory);
        if (normalizedMemory is null)
        {
            return false;
        }

        if (membership.Role != "Owner")
        {
            var controllableTokens = targetMap.Tokens.Where(token => MatchesVisionMemoryKey(token, normalizedMemory.Key)).ToList();
            if (controllableTokens.Count == 0)
            {
                throw new UnauthorizedAccessException("You cannot update remembered sight for that token.");
            }

            var canControlAny = false;
            foreach (var token in controllableTokens)
            {
                if (await CanUserControlTokenAsync(token, userId, cancellationToken))
                {
                    canControlAny = true;
                    break;
                }
            }

            if (!canControlAny)
            {
                throw new UnauthorizedAccessException("You cannot update remembered sight for that token.");
            }
        }

        var latestCampaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (latestCampaign is null)
        {
            return null;
        }

        var latestLibrary = ParseCampaignMapLibrary(latestCampaign.CampaignMapJson);
        var latestActiveMap = latestLibrary.Maps.FirstOrDefault(map => map.Id == latestLibrary.ActiveMapId) ?? latestLibrary.Maps[0];
        var latestTargetMap = latestLibrary.Maps.FirstOrDefault(map => map.Id == request.MapId);
        if (latestTargetMap is null)
        {
            return null;
        }

        if (membership.Role != "Owner" && latestTargetMap.Id != latestActiveMap.Id)
        {
            throw new UnauthorizedAccessException("Members can only remember sight on the active map.");
        }

        if (membership.Role != "Owner")
        {
            var controllableTokens = latestTargetMap.Tokens.Where(token => MatchesVisionMemoryKey(token, normalizedMemory.Key)).ToList();
            if (controllableTokens.Count == 0)
            {
                throw new UnauthorizedAccessException("You cannot update remembered sight for that token.");
            }

            var canControlAny = false;
            foreach (var token in controllableTokens)
            {
                if (await CanUserControlTokenAsync(token, userId, cancellationToken))
                {
                    canControlAny = true;
                    break;
                }
            }

            if (!canControlAny)
            {
                throw new UnauthorizedAccessException("You cannot update remembered sight for that token.");
            }
        }

        var updatedMaps = latestLibrary.Maps
            .Select(map => map.Id == latestTargetMap.Id
                ? map with
                {
                    VisionMemory = map.VisionMemory
                        .Where(entry => !string.Equals(entry.Key, normalizedMemory.Key, StringComparison.OrdinalIgnoreCase))
                        .Append(normalizedMemory)
                        .ToList()
                }
                : map)
            .ToList();

        var updated = await campaignRepository.UpdateMapAsync(campaignId, new CampaignMapLibraryDto(latestLibrary.ActiveMapId, updatedMaps), cancellationToken);
        return updated is not null;
    }

    public async Task<bool?> ResetMapVisionAsync(Guid campaignId, Guid mapId, Guid userId, CancellationToken cancellationToken = default)
    {
        if (mapId == Guid.Empty)
        {
            return false;
        }

        var campaign = await RequireOwnerCampaignAsync(campaignId, userId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var targetMap = library.Maps.FirstOrDefault(map => map.Id == mapId);
        if (targetMap is null)
        {
            return null;
        }

        var latestCampaign = await campaignRepository.GetByIdAsync(campaignId, cancellationToken);
        if (latestCampaign is null)
        {
            return null;
        }

        var latestLibrary = ParseCampaignMapLibrary(latestCampaign.CampaignMapJson);
        if (!latestLibrary.Maps.Any(map => map.Id == mapId))
        {
            return null;
        }

        var updatedMaps = latestLibrary.Maps
            .Select(map => map.Id == mapId ? map with { VisionMemory = [] } : map)
            .ToList();

        var updated = await campaignRepository.UpdateMapAsync(campaignId, new CampaignMapLibraryDto(latestLibrary.ActiveMapId, updatedMaps), cancellationToken);
        return updated is not null;
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

    private async Task<bool> CanUserControlTokenAsync(CampaignMapTokenDto token, Guid userId, CancellationToken cancellationToken)
    {
        if (token.AssignedUserId == userId)
        {
            return true;
        }

        if (token.AssignedCharacterId is not Guid assignedCharacterId || assignedCharacterId == Guid.Empty)
        {
            return false;
        }

        var character = await characterRepository.GetByIdAsync(assignedCharacterId, cancellationToken);
        return character?.OwnerUserId == userId;
    }

    private static bool MatchesVisionMemoryKey(CampaignMapTokenDto token, string key)
    {
        return string.Equals(BuildVisionMemoryKey(token), key, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildVisionMemoryKey(CampaignMapTokenDto token)
    {
        if (token.AssignedCharacterId is Guid assignedCharacterId && assignedCharacterId != Guid.Empty)
        {
            return $"character:{assignedCharacterId}";
        }

        if (token.AssignedUserId is Guid assignedUserId && assignedUserId != Guid.Empty)
        {
            return $"user:{assignedUserId}";
        }

        return $"token:{token.Id}";
    }

    private static CampaignDto MapCampaign(Campaign campaign, Guid userId)
    {
        var currentUserRole = campaign.Memberships
            .FirstOrDefault(member => member.UserId == userId && member.Status == "Active")
            ?.Role ?? "Member";

        var library = ParseCampaignMapLibrary(campaign.CampaignMapJson);
        var activeMap = library.Maps.FirstOrDefault(map => map.Id == library.ActiveMapId) ?? library.Maps[0];
        var firstMap = library.Maps[0];
        IReadOnlyList<CampaignMapBoardDto> visibleMaps = string.Equals(currentUserRole, "Owner", StringComparison.OrdinalIgnoreCase)
            ? library.Maps
            : library.Maps
                .Where(map => map.Id == firstMap.Id || map.Id == activeMap.Id)
                .DistinctBy(map => map.Id)
                .ToList();

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
            campaign.CharacterAssignments.Count,
            ParseSessions(campaign.SessionsJson),
            ParseNamedItems(campaign.NpcsJson),
            ParseNamedItems(campaign.LootJson),
            ParseOpenThreads(campaign.OpenThreadsJson),
            ParseWorldNotes(campaign.WorldNotesJson),
            new CampaignMapDto(activeMap.Background, activeMap.BackgroundImageUrl, activeMap.GridColumns, activeMap.GridRows, activeMap.GridColor, activeMap.GridOffsetX, activeMap.GridOffsetY, activeMap.Strokes, activeMap.Walls, activeMap.Icons, activeMap.Tokens, activeMap.Decorations, activeMap.Labels, activeMap.Layers, activeMap.VisionMemory),
            visibleMaps,
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

    private static CampaignSummaryDto MapCampaignSummary(CampaignSummaryRecord campaign)
    {
        var levelStart = Math.Clamp(campaign.LevelStart, 1, 20);
        var levelEnd = Math.Clamp(campaign.LevelEnd, levelStart, 20);

        return new CampaignSummaryDto(
            campaign.Id,
            campaign.Name,
            campaign.Setting,
            campaign.Tone,
            levelStart,
            levelEnd,
            campaign.Hook,
            campaign.NextSession,
            campaign.Summary,
            campaign.CreatedAtUtc,
            campaign.CharacterCount,
            CountJsonArrayItems(campaign.SessionsJson),
            CountJsonArrayItems(campaign.NpcsJson),
            CountJsonArrayItems(campaign.OpenThreadsJson),
            campaign.CurrentUserRole
        );
    }

    private static int CountJsonArrayItems(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return 0;
        }

        try
        {
            using var document = JsonDocument.Parse(json);
            if (document.RootElement.ValueKind != JsonValueKind.Array)
            {
                return 0;
            }

            return document.RootElement.GetArrayLength();
        }
        catch
        {
            return 0;
        }
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
                    legacyMap.GridColumns,
                    legacyMap.GridRows,
                    legacyMap.GridColor,
                    legacyMap.GridOffsetX,
                    legacyMap.GridOffsetY,
                    legacyMap.Strokes,
                    legacyMap.Walls,
                    legacyMap.Icons,
                    legacyMap.Tokens,
                    legacyMap.Decorations,
                    legacyMap.Labels,
                    legacyMap.Layers,
                    legacyMap.VisionMemory)]));
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

        var normalizedWalls = NormalizeMapWallCollection(map.Walls);

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
                NormalizeMapTokenSize(token.Size),
                token.Note?.Trim() ?? string.Empty,
                NormalizeMapAssignedUserId(token.AssignedUserId, token.AssignedCharacterId),
                NormalizeMapAssignedCharacterId(token.AssignedCharacterId)))
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
                ClampMapRotation(label.Rotation),
                NormalizeMapLabelStyle(label.Style, label.Tone)))
            .ToList();

        var normalizedLayers = new CampaignMapLayersDto(
            NormalizeMapStrokeCollection(map.Layers?.Rivers),
            NormalizeMapDecorationCollection(map.Layers?.MountainChains),
            NormalizeMapDecorationCollection(map.Layers?.ForestBelts));
        var normalizedVisionMemory = NormalizeMapVisionMemoryCollection(map.VisionMemory);

        return new CampaignMapDto(
            NormalizeMapBackground(map.Background),
            NormalizeMapBackgroundImageUrl(map.BackgroundImageUrl),
            NormalizeMapGridCount(map.GridColumns, DefaultMapGridColumns),
            NormalizeMapGridCount(map.GridRows, DefaultMapGridRows),
            NormalizeMapGridColor(map.GridColor, map.Background),
            NormalizeMapGridOffset(map.GridOffsetX, DefaultMapGridOffsetX),
            NormalizeMapGridOffset(map.GridOffsetY, DefaultMapGridOffsetY),
            normalizedStrokes,
            normalizedWalls,
            normalizedIcons,
            normalizedTokens,
            normalizedDecorations,
            normalizedLabels,
                normalizedLayers,
                normalizedVisionMemory);
    }

    private static CampaignMapBoardDto NormalizeCampaignMapBoard(CampaignMapBoardDto map)
    {
        var normalized = NormalizeCampaignMap(new CampaignMapDto(
            map.Background,
            map.BackgroundImageUrl,
            map.GridColumns,
            map.GridRows,
            map.GridColor,
            map.GridOffsetX,
            map.GridOffsetY,
            map.Strokes,
            map.Walls,
            map.Icons,
            map.Tokens,
            map.Decorations,
            map.Labels,
            map.Layers,
            map.VisionMemory));

        return new CampaignMapBoardDto(
            map.Id == Guid.Empty ? Guid.NewGuid() : map.Id,
            string.IsNullOrWhiteSpace(map.Name) ? "Untitled Map" : map.Name.Trim(),
            normalized.Background,
            normalized.BackgroundImageUrl,
            normalized.GridColumns,
            normalized.GridRows,
            normalized.GridColor,
            normalized.GridOffsetX,
            normalized.GridOffsetY,
            normalized.Strokes,
            normalized.Walls,
            normalized.Icons,
            normalized.Tokens,
            normalized.Decorations,
            normalized.Labels,
            normalized.Layers,
            normalized.VisionMemory);
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
                DefaultCampaignMapBoard.GridColumns,
                DefaultCampaignMapBoard.GridRows,
                DefaultCampaignMapBoard.GridColor,
                DefaultCampaignMapBoard.GridOffsetX,
                DefaultCampaignMapBoard.GridOffsetY,
                DefaultCampaignMapBoard.Strokes,
                DefaultCampaignMapBoard.Walls,
                DefaultCampaignMapBoard.Icons,
                DefaultCampaignMapBoard.Tokens,
                DefaultCampaignMapBoard.Decorations,
                DefaultCampaignMapBoard.Labels,
                DefaultCampaignMapBoard.Layers,
                DefaultCampaignMapBoard.VisionMemory));
        }

        var activeMapId = library.ActiveMapId != Guid.Empty && maps.Any(map => map.Id == library.ActiveMapId)
            ? library.ActiveMapId
            : maps[0].Id;

        return new CampaignMapLibraryDto(activeMapId, maps);
    }

    private static Guid? NormalizeMapAssignedUserId(Guid? assignedUserId, Guid? assignedCharacterId)
    {
        if (assignedCharacterId is Guid characterId && characterId != Guid.Empty)
        {
            return null;
        }

        return assignedUserId is Guid userId && userId != Guid.Empty ? userId : null;
    }

    private static Guid? NormalizeMapAssignedCharacterId(Guid? assignedCharacterId)
    {
        return assignedCharacterId is Guid characterId && characterId != Guid.Empty ? characterId : null;
    }

    private static IReadOnlyList<CampaignMapVisionMemoryDto> NormalizeMapVisionMemoryCollection(IReadOnlyList<CampaignMapVisionMemoryDto>? entries)
    {
        return (entries ?? [])
            .Select(NormalizeMapVisionMemory)
            .Where(entry => entry is not null)
            .Cast<CampaignMapVisionMemoryDto>()
            .DistinctBy(entry => entry.Key, StringComparer.OrdinalIgnoreCase)
            .ToList();
    }

    private static CampaignMapVisionMemoryDto? NormalizeMapVisionMemory(CampaignMapVisionMemoryDto? entry)
    {
        if (entry is null || string.IsNullOrWhiteSpace(entry.Key))
        {
            return null;
        }

        var normalizedPolygons = (entry.Polygons ?? [])
            .Select(polygon => new CampaignMapVisionPolygonDto(NormalizeMapPoints(polygon.Points).Take(256).ToList()))
            .Where(polygon => polygon.Points.Count >= 3)
            .Take(40)
            .ToList();

        if (normalizedPolygons.Count == 0)
        {
            return null;
        }

        return new CampaignMapVisionMemoryDto(
            entry.Key.Trim(),
            normalizedPolygons,
            entry.LastOrigin is null ? null : new CampaignMapPointDto(ClampMapCoordinate(entry.LastOrigin.X), ClampMapCoordinate(entry.LastOrigin.Y)),
            entry.LastPolygonHash?.Trim() ?? string.Empty);
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

    private static IReadOnlyList<CampaignMapWallDto> NormalizeMapWallCollection(IReadOnlyList<CampaignMapWallDto>? walls)
    {
        return (walls ?? [])
            .Where(wall => wall.Points is { Count: > 0 })
            .Select(wall => new CampaignMapWallDto(
                wall.Id == Guid.Empty ? Guid.NewGuid() : wall.Id,
                NormalizeMapColor(wall.Color),
                Math.Clamp(wall.Width, 2, 18),
                NormalizeMapPoints(wall.Points),
                wall.BlocksVision ?? true,
                wall.BlocksMovement ?? true))
            .Where(wall => wall.Points.Count > 0)
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
            "Battlemap" => "Battlemap",
            _ => "Parchment"
        };
    }

    private static string NormalizeMapBackgroundImageUrl(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? string.Empty : value.Trim();
    }

    private static double NormalizeMapGridCount(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value) || value <= 0d)
        {
            return fallback;
        }

        return Math.Clamp(Math.Round(value * 2d, MidpointRounding.AwayFromZero) / 2d, 8d, 60d);
    }

    private static string NormalizeMapGridColor(string? value, string? background)
    {
        var trimmed = value?.Trim().ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(trimmed) && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^#[0-9a-f]{6}$"))
        {
            return trimmed;
        }

        return DefaultGridColorForBackground(background);
    }

    private static double NormalizeMapGridOffset(double value, double fallback)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return fallback;
        }

        return Math.Clamp(Math.Round(value * 20d, MidpointRounding.AwayFromZero) / 20d, -1d, 1d);
    }

    private static string DefaultGridColorForBackground(string? background)
    {
        return NormalizeMapBackground(background) switch
        {
            "Coast" => "#3f667e",
            "City" => "#594532",
            "Cavern" => "#4a5f3e",
            "Battlemap" => "#584f43",
            _ => DefaultMapGridColor
        };
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

    private static CampaignMapLabelStyleDto NormalizeMapLabelStyle(CampaignMapLabelStyleDto? style, string? tone)
    {
        var normalizedTone = NormalizeMapLabelTone(tone);
        var defaults = DefaultMapLabelStyle(normalizedTone);

        return new CampaignMapLabelStyleDto(
            NormalizeMapLabelColor(style?.Color, normalizedTone),
            NormalizeMapLabelCssColor(style?.BackgroundColor, defaults.BackgroundColor),
            NormalizeMapLabelCssColor(style?.BorderColor, defaults.BorderColor),
            NormalizeMapLabelFontFamily(style?.FontFamily, normalizedTone),
            ClampMapLabelFontSize(style?.FontSize ?? defaults.FontSize, normalizedTone),
            ClampMapLabelFontWeight(style?.FontWeight ?? defaults.FontWeight, normalizedTone),
            ClampMapLabelLetterSpacing(style?.LetterSpacing ?? defaults.LetterSpacing, normalizedTone),
            NormalizeMapLabelFontStyle(style?.FontStyle, defaults.FontStyle),
            NormalizeMapLabelTextTransform(style?.TextTransform, defaults.TextTransform),
            ClampMapLabelBorderWidth(style?.BorderWidth ?? defaults.BorderWidth, normalizedTone),
            ClampMapLabelBorderRadius(style?.BorderRadius ?? defaults.BorderRadius, normalizedTone),
            ClampMapLabelPaddingX(style?.PaddingX ?? defaults.PaddingX, normalizedTone),
            ClampMapLabelPaddingY(style?.PaddingY ?? defaults.PaddingY, normalizedTone),
            NormalizeMapLabelCssEffect(style?.TextShadow, defaults.TextShadow),
            NormalizeMapLabelCssEffect(style?.BoxShadow, defaults.BoxShadow),
            ClampMapLabelOpacity(style?.Opacity ?? defaults.Opacity, normalizedTone));
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

    private static CampaignMapLabelStyleDto DefaultMapLabelStyle(string tone)
    {
        return tone == "Feature"
            ? new CampaignMapLabelStyleDto("#f6ead8", "transparent", "transparent", "body", 0.84d, 600, 0.08d, "italic", "none", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.72), 0 2px 10px rgba(0, 0, 0, 0.34)", "none", 0.98d)
            : new CampaignMapLabelStyleDto("#fff4e5", "transparent", "transparent", "display", 1d, 650, 0.18d, "normal", "uppercase", 0d, 8d, 0d, 0d, "0 1px 0 rgba(43, 28, 19, 0.78), 0 2px 12px rgba(0, 0, 0, 0.4)", "none", 1d);
    }

    private static string NormalizeMapLabelColor(string? color, string tone)
    {
        return NormalizeMapLabelCssColor(color, DefaultMapLabelStyle(tone).Color);
    }

    private static string NormalizeMapLabelCssColor(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(transparent|#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\\([\\d\\s.,%]+\\)|hsla?\\([\\d\\s.,%]+\\))$")
            ? trimmed
            : fallback;
    }

    private static string NormalizeMapLabelFontFamily(string? fontFamily, string tone)
    {
        return string.Equals(fontFamily?.Trim(), "body", StringComparison.OrdinalIgnoreCase)
            ? "body"
            : DefaultMapLabelStyle(tone).FontFamily;
    }

    private static string NormalizeMapLabelFontStyle(string? fontStyle, string fallback)
    {
        return string.Equals(fontStyle?.Trim(), "italic", StringComparison.OrdinalIgnoreCase) ? "italic" : fallback;
    }

    private static string NormalizeMapLabelTextTransform(string? textTransform, string fallback)
    {
        return string.Equals(textTransform?.Trim(), "none", StringComparison.OrdinalIgnoreCase) ? "none" : fallback;
    }

    private static double ClampMapLabelBorderWidth(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).BorderWidth;
        }

        return Math.Clamp(value, 0d, 6d);
    }

    private static double ClampMapLabelBorderRadius(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).BorderRadius;
        }

        return Math.Clamp(value, 0d, 32d);
    }

    private static double ClampMapLabelPaddingX(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).PaddingX;
        }

        return Math.Clamp(value, 0d, 24d);
    }

    private static double ClampMapLabelPaddingY(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).PaddingY;
        }

        return Math.Clamp(value, 0d, 16d);
    }

    private static string NormalizeMapLabelCssEffect(string? value, string fallback)
    {
        var trimmed = value?.Trim();
        return !string.IsNullOrWhiteSpace(trimmed) && trimmed.Length <= 120 && System.Text.RegularExpressions.Regex.IsMatch(trimmed, "^(none|[a-zA-Z0-9#(),.%\\s+-]+)$")
            ? trimmed
            : fallback;
    }

    private static double ClampMapLabelFontSize(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).FontSize;
        }

        return Math.Clamp(value, 0.72d, 2.4d);
    }

    private static int ClampMapLabelFontWeight(int value, string tone)
    {
        if (value <= 0)
        {
            return DefaultMapLabelStyle(tone).FontWeight;
        }

        return Math.Clamp((int)Math.Round(value / 50d) * 50, 400, 800);
    }

    private static double ClampMapLabelLetterSpacing(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).LetterSpacing;
        }

        return Math.Clamp(value, -0.04d, 0.32d);
    }

    private static double ClampMapLabelOpacity(double value, string tone)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return DefaultMapLabelStyle(tone).Opacity;
        }

        return Math.Clamp(value, 0.45d, 1d);
    }

    private static double ClampMapScale(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 1d;
        }

        return Math.Clamp(value, 0.55d, 1.8d);
    }

    private static double NormalizeMapTokenSize(double value)
    {
        if (double.IsNaN(value) || double.IsInfinity(value))
        {
            return 1d;
        }

        double[] tokenSizes = [0.5d, 1d, 2d, 4d];
        return tokenSizes.Aggregate((closest, size) => Math.Abs(size - value) < Math.Abs(closest - value) ? size : closest);
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
