namespace DungeonKeep.ApplicationService.Contracts;

public sealed record MessageContactDto(
    Guid UserId,
    string DisplayName
);

public sealed record MessageThreadSummaryDto(
    Guid Id,
    string OtherUserDisplayName,
    string OtherUserInitial,
    string LastMessagePreview,
    DateTime LastMessageAtUtc,
    bool HasUnread
);

public sealed record MessageDto(
    Guid Id,
    Guid SenderUserId,
    string SenderDisplayName,
    string Body,
    DateTime SentAtUtc
);

public sealed record MessageThreadDto(
    Guid Id,
    string OtherUserDisplayName,
    Guid OtherUserId,
    IReadOnlyList<MessageDto> Messages
);

public sealed record SendMessageRequest(string Body);

public sealed record ComposeMessageRequest(Guid RecipientUserId, string Body);
