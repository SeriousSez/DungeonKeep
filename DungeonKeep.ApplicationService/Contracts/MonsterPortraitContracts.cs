namespace DungeonKeep.ApplicationService.Contracts;

public sealed record MonsterPortraitOverrideDto(
    string Slug,
    string ImageUrl,
    string OriginalImageUrl,
    string UpdatedAtUtc,
    Guid? UpdatedByUserId
);

public sealed record UpsertMonsterPortraitOverrideRequest(
    string Slug,
    string ImageUrl,
    string OriginalImageUrl
);
