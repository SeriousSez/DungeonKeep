using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;

namespace DungeonKeep.ApplicationService.Services;

public sealed class MonsterPortraitService(IMonsterPortraitRepository repository) : IMonsterPortraitService
{
    public async Task<IReadOnlyList<MonsterPortraitOverrideDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var entries = await repository.GetAllAsync(cancellationToken);
        return entries
            .Select(MapDto)
            .ToList();
    }

    public async Task<MonsterPortraitOverrideDto> UpsertAsync(Guid updatedByUserId, UpsertMonsterPortraitOverrideRequest request, CancellationToken cancellationToken = default)
    {
        var slug = request.Slug.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(slug))
        {
            throw new InvalidOperationException("Monster slug is required.");
        }

        var imageUrl = request.ImageUrl.Trim();
        if (string.IsNullOrWhiteSpace(imageUrl))
        {
            throw new InvalidOperationException("ImageUrl is required.");
        }

        var originalImageUrl = string.IsNullOrWhiteSpace(request.OriginalImageUrl)
            ? imageUrl
            : request.OriginalImageUrl.Trim();

        var entry = await repository.UpsertAsync(slug, imageUrl, originalImageUrl, updatedByUserId, cancellationToken);
        return MapDto(entry);
    }

    private static MonsterPortraitOverrideDto MapDto(Domain.Entities.MonsterPortraitOverride entry)
    {
        return new MonsterPortraitOverrideDto(
            entry.Slug,
            entry.ImageUrl,
            entry.OriginalImageUrl,
            entry.UpdatedAtUtc.ToString("O"),
            entry.UpdatedByUserId
        );
    }
}
