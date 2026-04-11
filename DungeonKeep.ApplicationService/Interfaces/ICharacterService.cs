using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICharacterService
{
    Task<IReadOnlyList<CharacterDto>> GetAccessibleAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CharacterDto>> GetByCampaignAsync(Guid campaignId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<CharacterDto>> GetUnassignedOwnedAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CharacterDto> CreateAsync(Guid? campaignId, CreateCharacterRequest request, AuthenticatedUser user, CancellationToken cancellationToken = default);
    Task<CharacterDto?> UpdateAsync(Guid characterId, UpdateCharacterRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CharacterDto?> UpdateCampaignAsync(Guid characterId, UpdateCharacterCampaignRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<GenerateCharacterBackstoryResponse> GenerateBackstoryAsync(GenerateCharacterBackstoryRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<GenerateCharacterPortraitResponse> GeneratePortraitAsync(GenerateCharacterPortraitRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CharacterDto?> UpdateBackstoryAsync(Guid characterId, UpdateCharacterBackstoryRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CharacterDto?> UpdateStatusAsync(Guid characterId, UpdateCharacterStatusRequest request, Guid userId, CancellationToken cancellationToken = default);
    Task<CharacterDto?> PromoteAsync(Guid characterId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteAsync(Guid characterId, Guid userId, CancellationToken cancellationToken = default);
}
