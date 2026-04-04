using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class CampaignRepository(DungeonKeepDbContext dbContext) : ICampaignRepository
{
    public async Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
            .Where(c => c.Memberships.Any(membership => membership.UserId == userId && membership.Status == "Active"))
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        dbContext.Campaigns.Add(campaign);
        await dbContext.SaveChangesAsync(cancellationToken);
        return campaign;
    }

    public async Task<Campaign?> UpdateAsync(Guid campaignId, string name, string setting, string tone, int levelStart, int levelEnd, string hook, string nextSession, string summary, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is null)
        {
            return null;
        }

        campaign.Name = name;
        campaign.Setting = setting;
        campaign.Tone = tone;
        campaign.LevelStart = levelStart;
        campaign.LevelEnd = levelEnd;
        campaign.Hook = hook;
        campaign.NextSession = nextSession;
        campaign.Summary = summary;

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> AddSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        sessions.Add(new PersistedCampaignSession(
            session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
            session.Title.Trim(),
            session.Date.Trim(),
            session.Location.Trim(),
            session.Objective.Trim(),
            NormalizeThreat(session.Threat)));

        campaign.SessionsJson = JsonSerializer.Serialize(sessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateSessionAsync(Guid campaignId, CampaignSessionDto session, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        var updated = false;

        for (var index = 0; index < sessions.Count; index++)
        {
            if (sessions[index].Id != session.Id)
            {
                continue;
            }

            sessions[index] = sessions[index] with
            {
                Title = session.Title.Trim(),
                Date = session.Date.Trim(),
                Location = session.Location.Trim(),
                Objective = session.Objective.Trim(),
                Threat = NormalizeThreat(session.Threat)
            };
            updated = true;
            break;
        }

        if (!updated)
        {
            return null;
        }

        campaign.SessionsJson = JsonSerializer.Serialize(sessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> RemoveSessionAsync(Guid campaignId, Guid sessionId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var sessions = ParseSessions(campaign.SessionsJson);
        var updatedSessions = sessions.Where(session => session.Id != sessionId).ToList();
        if (updatedSessions.Count == sessions.Count)
        {
            return null;
        }

        campaign.SessionsJson = JsonSerializer.Serialize(updatedSessions);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> AddNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            if (!collection.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                collection.Add(name.Trim());
            }
        }, campaign => campaign.NpcsJson, (campaign, json) => campaign.NpcsJson = json, cancellationToken);
    }

    public async Task<Campaign?> RemoveNpcAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            collection.RemoveAll(item => string.Equals(item, name, StringComparison.OrdinalIgnoreCase));
        }, campaign => campaign.NpcsJson, (campaign, json) => campaign.NpcsJson = json, cancellationToken);
    }

    public async Task<Campaign?> AddLootAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            if (!collection.Contains(name, StringComparer.OrdinalIgnoreCase))
            {
                collection.Add(name.Trim());
            }
        }, campaign => campaign.LootJson, (campaign, json) => campaign.LootJson = json, cancellationToken);
    }

    public async Task<Campaign?> RemoveLootAsync(Guid campaignId, string name, CancellationToken cancellationToken = default)
    {
        return await UpdateNamedCollectionAsync(campaignId, collection =>
        {
            collection.RemoveAll(item => string.Equals(item, name, StringComparison.OrdinalIgnoreCase));
        }, campaign => campaign.LootJson, (campaign, json) => campaign.LootJson = json, cancellationToken);
    }

    public async Task<Campaign?> AddThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        threads.Add(new PersistedCampaignThread(
            threadId == Guid.Empty ? Guid.NewGuid() : threadId,
            text.Trim(),
            NormalizeVisibility(visibility)));

        campaign.OpenThreadsJson = JsonSerializer.Serialize(threads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> UpdateThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        var updated = false;

        for (var i = 0; i < threads.Count; i++)
        {
            var current = threads[i];
            if (current.Id != threadId)
            {
                continue;
            }

            threads[i] = current with
            {
                Text = text.Trim(),
                Visibility = NormalizeVisibility(visibility)
            };

            updated = true;
            break;
        }

        if (!updated)
        {
            return null;
        }

        campaign.OpenThreadsJson = JsonSerializer.Serialize(threads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> ArchiveThreadAsync(Guid campaignId, Guid threadId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var threads = ParseThreads(campaign.OpenThreadsJson);
        var updatedThreads = threads
            .Where(item => item.Id != threadId)
            .ToList();

        if (updatedThreads.Count == threads.Count)
        {
            return null;
        }

        campaign.OpenThreadsJson = JsonSerializer.Serialize(updatedThreads);
        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        var campaign = await dbContext.Campaigns
            .Include(c => c.Memberships)
                .ThenInclude(membership => membership.User)
            .Include(c => c.Characters)
                .ThenInclude(character => character.OwnerUser)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var existing = campaign.Memberships.FirstOrDefault(membership => membership.Email == normalizedEmail);
        if (existing is not null)
        {
            return campaign;
        }

        var invitedUser = await dbContext.AppUsers.FirstOrDefaultAsync(appUser => appUser.Email == normalizedEmail, cancellationToken);

        dbContext.CampaignMemberships.Add(new CampaignMembership
        {
            Id = Guid.NewGuid(),
            CampaignId = campaignId,
            UserId = invitedUser?.Id,
            Email = normalizedEmail,
            Role = "Member",
            Status = invitedUser is null ? "Pending" : "Active",
            InvitedByUserId = user.Id,
            CreatedAtUtc = DateTime.UtcNow
        });

        await dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(campaignId, cancellationToken);
    }

    public async Task<bool> IsActiveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.CampaignMemberships
            .AnyAsync(membership => membership.CampaignId == campaignId && membership.UserId == userId && membership.Status == "Active", cancellationToken);
    }

    public async Task RemoveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default)
    {
        var membership = await dbContext.CampaignMemberships
            .FirstOrDefaultAsync(
                entry => entry.CampaignId == campaignId && entry.UserId == userId && entry.Status == "Active",
                cancellationToken);

        if (membership is null)
        {
            return;
        }

        dbContext.CampaignMemberships.Remove(membership);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Guid campaignId, CancellationToken cancellationToken = default)
    {
        var campaign = await dbContext.Campaigns.FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);
        if (campaign is not null)
        {
            dbContext.Campaigns.Remove(campaign);
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static List<PersistedCampaignThread> ParseThreads(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            var threads = JsonSerializer.Deserialize<List<PersistedCampaignThread>>(json);
            if (threads is { Count: > 0 })
            {
                return threads
                    .Where(thread => !string.IsNullOrWhiteSpace(thread.Text))
                    .Select(thread => new PersistedCampaignThread(
                        thread.Id == Guid.Empty ? Guid.NewGuid() : thread.Id,
                        thread.Text.Trim(),
                        NormalizeVisibility(thread.Visibility)))
                    .ToList();
            }

            var legacyThreads = JsonSerializer.Deserialize<List<string>>(json) ?? [];
            return legacyThreads
                .Where(thread => !string.IsNullOrWhiteSpace(thread))
                .Select(thread => new PersistedCampaignThread(Guid.NewGuid(), thread.Trim(), "Party"))
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private async Task<Campaign?> UpdateNamedCollectionAsync(
        Guid campaignId,
        Action<List<string>> updateAction,
        Func<Campaign, string> readJson,
        Action<Campaign, string> writeJson,
        CancellationToken cancellationToken)
    {
        var campaign = await dbContext.Campaigns
            .Include(c => c.Characters)
            .FirstOrDefaultAsync(c => c.Id == campaignId, cancellationToken);

        if (campaign is null)
        {
            return null;
        }

        var items = ParseNamedItems(readJson(campaign));
        updateAction(items);
        writeJson(campaign, JsonSerializer.Serialize(items));
        await dbContext.SaveChangesAsync(cancellationToken);
        return campaign;
    }

    private static List<PersistedCampaignSession> ParseSessions(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return (JsonSerializer.Deserialize<List<PersistedCampaignSession>>(json) ?? [])
                .Where(session => !string.IsNullOrWhiteSpace(session.Title))
                .Select(session => new PersistedCampaignSession(
                    session.Id == Guid.Empty ? Guid.NewGuid() : session.Id,
                    session.Title.Trim(),
                    session.Date.Trim(),
                    session.Location.Trim(),
                    session.Objective.Trim(),
                    NormalizeThreat(session.Threat)))
                .ToList();
        }
        catch
        {
            return [];
        }
    }

    private static List<string> ParseNamedItems(string json)
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

    private sealed record PersistedCampaignThread(Guid Id, string Text, string Visibility);
    private sealed record PersistedCampaignSession(Guid Id, string Title, string Date, string Location, string Objective, string Threat);
}
