using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICharacterRepository
{
    Task<IReadOnlyList<Character>> GetByCampaignIdAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Character>> GetUnassignedOwnedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Character> AddAsync(Character character, CancellationToken cancellationToken = default);
    Task<Character?> GetByIdAsync(Guid characterId, CancellationToken cancellationToken = default);
    Task<Character?> UpdateAsync(Guid characterId, string name, string playerName, string className, int level, string background, string notes, Guid? campaignId, CancellationToken cancellationToken = default);
    Task<Character?> UpdateCampaignAsync(Guid characterId, Guid? campaignId, CancellationToken cancellationToken = default);
    Task<Character?> UpdateBackstoryAsync(Guid characterId, string backstory, CancellationToken cancellationToken = default);
    Task<Character?> UpdateStatusAsync(Guid characterId, string status, CancellationToken cancellationToken = default);
    Task<Character?> PromoteAsync(Guid characterId, CancellationToken cancellationToken = default);
}
