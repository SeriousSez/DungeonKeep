namespace DungeonKeep.Domain.Entities;

public sealed class UserNotification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string Link { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    /// <summary>JSON object of extra key/value pairs (e.g. {"campaignId":"..."}).</summary>
    public string? MetadataJson { get; set; }

    public AppUser? User { get; set; }
}
