using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IBackstoryGenerator
{
    Task<string> GenerateAsync(GenerateCharacterBackstoryRequest request, CancellationToken cancellationToken = default);
}