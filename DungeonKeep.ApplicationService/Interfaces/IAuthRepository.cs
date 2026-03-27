using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IAuthRepository
{
    Task<AppUser?> GetUserByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<AppUser> AddUserAsync(AppUser user, CancellationToken cancellationToken = default);
    Task<AuthSession> AddSessionAsync(AuthSession session, CancellationToken cancellationToken = default);
    Task<AuthSession?> GetSessionByTokenAsync(string token, CancellationToken cancellationToken = default);
    Task ActivatePendingMembershipsAsync(string normalizedEmail, Guid userId, CancellationToken cancellationToken = default);
}