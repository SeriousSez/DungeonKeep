using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAuthRepository
{
    Task<AppUser?> GetUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<AppUser?> GetUserByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AppUser> AddUserAsync(AppUser user, CancellationToken cancellationToken = default);
    Task<AppUser> UpdateUserAsync(AppUser user, CancellationToken cancellationToken = default);
    Task<AuthSession> AddSessionAsync(AuthSession session, CancellationToken cancellationToken = default);
    Task<AuthSession?> GetSessionByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<(Guid CampaignId, string CampaignName, Guid? InvitedByUserId)>> ActivatePendingMembershipsAsync(string normalizedEmail, Guid userId, CancellationToken cancellationToken = default);
}