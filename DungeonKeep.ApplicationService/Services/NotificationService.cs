using System.Text.Json;
using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;

namespace DungeonKeep.ApplicationService.Services;

public sealed class NotificationService(INotificationRepository notificationRepository) : INotificationService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<IReadOnlyList<NotificationDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var notifications = await notificationRepository.GetForUserAsync(userId, cancellationToken);
        return notifications
            .Select(n => new NotificationDto(n.Id, n.Type, n.Title, n.Body, n.Link, n.IsRead, n.CreatedAtUtc, ParseMetadata(n.MetadataJson)))
            .ToList();
    }

    private static IReadOnlyDictionary<string, string>? ParseMetadata(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<Dictionary<string, string>>(json, JsonOpts); }
        catch { return null; }
    }

    public async Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var notification = await notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification is null || notification.UserId != userId) return;
        await notificationRepository.MarkReadAsync(notificationId, cancellationToken);
    }

    public async Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        await notificationRepository.MarkAllReadAsync(userId, cancellationToken);
    }

    public async Task DismissAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default)
    {
        var notification = await notificationRepository.GetByIdAsync(notificationId, cancellationToken);
        if (notification is null || notification.UserId != userId) return;
        await notificationRepository.DismissAsync(notificationId, cancellationToken);
    }
}
