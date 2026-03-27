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

    public async Task<Campaign?> ArchiveThreadAsync(Guid campaignId, string thread, CancellationToken cancellationToken = default)
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
            .Where(item => !string.Equals(item, thread, StringComparison.OrdinalIgnoreCase))
            .ToList();

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

    private static List<string> ParseThreads(string json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<List<string>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}
