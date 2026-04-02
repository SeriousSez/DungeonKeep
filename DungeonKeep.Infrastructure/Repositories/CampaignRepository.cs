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
        return campaign;
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
        return campaign;
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
        return campaign;
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

    private static string NormalizeVisibility(string? visibility)
    {
        if (string.Equals(visibility, "GMOnly", StringComparison.OrdinalIgnoreCase))
        {
            return "GMOnly";
        }

        return "Party";
    }

    private sealed record PersistedCampaignThread(Guid Id, string Text, string Visibility);
}
