using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class AuthRepository(DungeonKeepDbContext dbContext) : IAuthRepository
{
    public async Task<AppUser?> GetUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppUsers.FirstOrDefaultAsync(user => user.Email == normalizedEmail, cancellationToken);
    }

    public async Task<AppUser?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await dbContext.AppUsers.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public async Task<AppUser> AddUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        dbContext.AppUsers.Add(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<AppUser> UpdateUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        dbContext.AppUsers.Update(user);
        await dbContext.SaveChangesAsync(cancellationToken);
        return user;
    }

    public async Task<AuthSession> AddSessionAsync(AuthSession session, CancellationToken cancellationToken = default)
    {
        dbContext.AuthSessions.Add(session);
        await dbContext.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task<AuthSession?> GetSessionByTokenAsync(string token, CancellationToken cancellationToken = default)
    {
        return await dbContext.AuthSessions
            .Include(session => session.User)
            .FirstOrDefaultAsync(session => session.Token == token, cancellationToken);
    }

    public async Task<IReadOnlyList<(Guid CampaignId, string CampaignName, Guid? InvitedByUserId)>> ActivatePendingMembershipsAsync(string normalizedEmail, Guid userId, CancellationToken cancellationToken = default)
    {
        var memberships = await dbContext.CampaignMemberships
            .Include(membership => membership.Campaign)
            .Where(membership => membership.Email == normalizedEmail && membership.UserId == null && membership.Status == "Pending")
            .ToListAsync(cancellationToken);

        foreach (var membership in memberships)
        {
            membership.UserId = userId;
            // Keep Status as "Pending" so the user can accept or decline from notifications.
        }

        if (memberships.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return memberships
            .Where(m => m.Campaign is not null)
            .Select(m => (m.CampaignId, m.Campaign!.Name, m.InvitedByUserId))
            .ToList();
    }
}