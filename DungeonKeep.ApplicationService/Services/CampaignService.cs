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

    private static string SerializeNamedItems(IEnumerable<string> items)
    {
        return JsonSerializer.Serialize(items
            .Where(item => !string.IsNullOrWhiteSpace(item))
            .Select(item => item.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase));
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
