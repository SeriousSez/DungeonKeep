using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Services;

public sealed class MessageService(
    IMessageRepository messageRepository,
    INotificationRepository notificationRepository) : IMessageService
{
    public async Task<IReadOnlyList<MessageContactDto>> GetContactsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await messageRepository.GetContactsAsync(userId, cancellationToken);
    }

    public async Task<IReadOnlyList<MessageThreadSummaryDto>> GetThreadsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var threads = await messageRepository.GetThreadsForUserAsync(userId, cancellationToken);
        return threads.Select(t => MapToSummary(t, userId)).ToList();
    }

    public async Task<MessageThreadDto?> GetThreadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default)
    {
        var thread = await messageRepository.GetThreadByIdAsync(threadId, cancellationToken);
        if (thread is null) return null;
        if (!thread.Participants.Any(p => p.UserId == userId)) return null;
        return MapToThreadDto(thread, userId);
    }

    public async Task<MessageThreadDto?> SendMessageAsync(Guid threadId, Guid userId, SendMessageRequest request, CancellationToken cancellationToken = default)
    {
        var thread = await messageRepository.GetThreadByIdAsync(threadId, cancellationToken);
        if (thread is null) return null;
        if (!thread.Participants.Any(p => p.UserId == userId)) return null;

        await messageRepository.AddMessageAsync(threadId, userId, request.Body.Trim(), cancellationToken);

        var senderName = thread.Participants.FirstOrDefault(p => p.UserId == userId)?.User?.DisplayName ?? "Someone";
        var otherParticipant = thread.Participants.FirstOrDefault(p => p.UserId != userId);
        if (otherParticipant is not null)
        {
            var preview = request.Body.Length > 100 ? request.Body[..100] + "…" : request.Body;
            await notificationRepository.AddAsync(new UserNotification
            {
                Id = Guid.NewGuid(),
                UserId = otherParticipant.UserId,
                Type = "NewMessage",
                Title = $"New message from {senderName}",
                Body = preview,
                Link = "/messages",
                IsRead = false,
                IsDismissed = false,
                CreatedAtUtc = DateTime.UtcNow
            }, cancellationToken);
        }

        var updated = await messageRepository.GetThreadByIdAsync(threadId, cancellationToken);
        return updated is null ? null : MapToThreadDto(updated, userId);
    }

    public async Task<MessageThreadDto> ComposeAsync(Guid userId, ComposeMessageRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await messageRepository.GetThreadBetweenUsersAsync(userId, request.RecipientUserId, cancellationToken);
        if (existing is null)
        {
            existing = await messageRepository.CreateThreadAsync(userId, request.RecipientUserId, cancellationToken);
        }

        await messageRepository.AddMessageAsync(existing.Id, userId, request.Body.Trim(), cancellationToken);

        var senderName = existing.Participants.FirstOrDefault(p => p.UserId == userId)?.User?.DisplayName ?? "Someone";
        var preview = request.Body.Length > 100 ? request.Body[..100] + "…" : request.Body;
        await notificationRepository.AddAsync(new UserNotification
        {
            Id = Guid.NewGuid(),
            UserId = request.RecipientUserId,
            Type = "NewMessage",
            Title = $"New message from {senderName}",
            Body = preview,
            Link = "/messages",
            IsRead = false,
            IsDismissed = false,
            CreatedAtUtc = DateTime.UtcNow
        }, cancellationToken);

        var updated = await messageRepository.GetThreadByIdAsync(existing.Id, cancellationToken);
        return MapToThreadDto(updated!, userId);
    }

    public async Task MarkThreadReadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default)
    {
        await messageRepository.MarkThreadReadAsync(threadId, userId, cancellationToken);
    }

    private static MessageThreadSummaryDto MapToSummary(DirectMessageThread thread, Guid userId)
    {
        var otherParticipant = thread.Participants.FirstOrDefault(p => p.UserId != userId);
        var otherName = otherParticipant?.User?.DisplayName ?? "Unknown";
        var otherInitial = otherName.Length > 0 ? otherName[0].ToString().ToUpperInvariant() : "?";

        var lastMessage = thread.Messages.OrderByDescending(m => m.SentAtUtc).FirstOrDefault();
        var preview = lastMessage?.Body ?? string.Empty;
        if (preview.Length > 80) preview = preview[..80] + "…";

        var myParticipant = thread.Participants.FirstOrDefault(p => p.UserId == userId);
        var hasUnread = thread.Messages.Any(m =>
            m.SenderUserId != userId &&
            (myParticipant?.LastReadAtUtc is null || m.SentAtUtc > myParticipant.LastReadAtUtc));

        return new MessageThreadSummaryDto(thread.Id, otherName, otherInitial, preview, thread.LastMessageAtUtc, hasUnread);
    }

    private static MessageThreadDto MapToThreadDto(DirectMessageThread thread, Guid userId)
    {
        var otherParticipant = thread.Participants.FirstOrDefault(p => p.UserId != userId);
        var otherName = otherParticipant?.User?.DisplayName ?? "Unknown";
        var otherUserId = otherParticipant?.UserId ?? Guid.Empty;

        var messages = thread.Messages
            .OrderBy(m => m.SentAtUtc)
            .Select(m => new MessageDto(m.Id, m.SenderUserId, m.Sender?.DisplayName ?? "Unknown", m.Body, m.SentAtUtc))
            .ToList();

        return new MessageThreadDto(thread.Id, otherName, otherUserId, messages);
    }
}
