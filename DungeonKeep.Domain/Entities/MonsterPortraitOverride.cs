namespace DungeonKeep.Domain.Entities;

public sealed class MonsterPortraitOverride
{
    public string Slug { get; set; } = string.Empty;
    public string ImageUrl { get; set; } = string.Empty;
    public string OriginalImageUrl { get; set; } = string.Empty;
    public DateTime UpdatedAtUtc { get; set; }
    public Guid? UpdatedByUserId { get; set; }
}
