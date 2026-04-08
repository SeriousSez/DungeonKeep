using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICharacterRepository
{
    Task<IReadOnlyList<Character>> GetAccessibleByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Character>> GetByCampaignIdAsync(Guid campaignId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Character>> GetUnassignedOwnedByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<Character> AddAsync(Character character, CancellationToken cancellationToken = default);
    Task<Character?> GetByIdAsync(Guid characterId, CancellationToken cancellationToken = default);
    Task<Character?> UpdateAsync(
        Guid characterId,
        string name,
        string playerName,
        string className,
        int level,
        string background,
        string notes,
        IReadOnlyCollection<Guid> campaignIds,
        int hitPoints,
        int deathSaveFailures,
        int deathSaveSuccesses,
        int armorClass,
        string species,
        string alignment,
        string lifestyle,
        string personalityTraits,
        string ideals,
        string bonds,
        string flaws,
        string equipment,
        string abilityScores,
        string skills,
        string savingThrows,
        string combatStats,
        string spells,
        int experiencePoints,
        string portraitUrl,
        string goals,
        string secrets,
        string sessionHistory,
        CancellationToken cancellationToken = default
    );
    Task UnassignOwnedByUserInCampaignAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task<Character?> UpdateCampaignAsync(Guid characterId, IReadOnlyCollection<Guid> campaignIds, CancellationToken cancellationToken = default);
    Task<Character?> UpdateBackstoryAsync(Guid characterId, string backstory, CancellationToken cancellationToken = default);
    Task<Character?> UpdateStatusAsync(Guid characterId, string status, CancellationToken cancellationToken = default);
    Task<Character?> PromoteAsync(Guid characterId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid characterId, CancellationToken cancellationToken = default);
}
