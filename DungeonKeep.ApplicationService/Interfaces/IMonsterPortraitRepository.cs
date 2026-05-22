using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IMonsterPortraitRepository
{
    Task<IReadOnlyList<MonsterPortraitOverride>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<MonsterPortraitOverride> UpsertAsync(string slug, string imageUrl, string originalImageUrl, Guid? updatedByUserId, CancellationToken cancellationToken = default);
}
