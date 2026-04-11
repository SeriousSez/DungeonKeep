using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface ICharacterPortraitGenerator
{
    Task<string> GenerateAsync(GenerateCharacterPortraitRequest request, CancellationToken cancellationToken = default);
}