namespace DungeonKeep.ApplicationService.Contracts;

public sealed record NotificationDto(
    Guid Id,
    string Type,
    string Title,
    string Body,
    string Link,
    bool IsRead,
    DateTime CreatedAtUtc,
    IReadOnlyDictionary<string, string>? Metadata
);
