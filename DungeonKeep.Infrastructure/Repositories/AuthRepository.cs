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

    public async Task<AppUser> AddUserAsync(AppUser user, CancellationToken cancellationToken = default)
    {
        dbContext.AppUsers.Add(user);
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

    public async Task ActivatePendingMembershipsAsync(string normalizedEmail, Guid userId, CancellationToken cancellationToken = default)
    {
        var memberships = await dbContext.CampaignMemberships
            .Where(membership => membership.Email == normalizedEmail && membership.UserId == null && membership.Status == "Pending")
            .ToListAsync(cancellationToken);

        foreach (var membership in memberships)
        {
            membership.UserId = userId;
            membership.Status = "Active";
        }

        if (memberships.Count > 0)
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}