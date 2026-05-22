using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IMonsterPortraitService
{
    Task<IReadOnlyList<MonsterPortraitOverrideDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<MonsterPortraitOverrideDto> UpsertAsync(Guid updatedByUserId, UpsertMonsterPortraitOverrideRequest request, CancellationToken cancellationToken = default);
}
