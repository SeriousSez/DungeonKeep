using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignRepository
{
    Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task<Campaign?> ArchiveThreadAsync(Guid campaignId, string thread, CancellationToken cancellationToken = default);
    Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default);
    Task<bool> IsActiveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
}
