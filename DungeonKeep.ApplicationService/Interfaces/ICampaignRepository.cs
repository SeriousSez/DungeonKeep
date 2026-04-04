using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICampaignRepository
{
    Task<IReadOnlyList<Campaign>> GetAllForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Campaign?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Campaign> AddAsync(Campaign campaign, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateAsync(Guid campaignId, string name, string setting, string tone, int levelStart, int levelEnd, string hook, string nextSession, string summary, CancellationToken cancellationToken = default);
    Task<Campaign?> AddThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default);
    Task<Campaign?> UpdateThreadAsync(Guid campaignId, Guid threadId, string text, string visibility, CancellationToken cancellationToken = default);
    Task<Campaign?> ArchiveThreadAsync(Guid campaignId, Guid threadId, CancellationToken cancellationToken = default);
    Task<Campaign?> InviteMemberAsync(Guid campaignId, string email, AuthenticatedUser user, CancellationToken cancellationToken = default);
    Task<bool> IsActiveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task RemoveMemberAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid campaignId, CancellationToken cancellationToken = default);
}
