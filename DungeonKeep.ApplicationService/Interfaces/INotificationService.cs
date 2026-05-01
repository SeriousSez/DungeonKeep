using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task MarkReadAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(Guid userId, CancellationToken cancellationToken = default);
    Task DismissAsync(Guid notificationId, Guid userId, CancellationToken cancellationToken = default);
    Task AddNotificationsAsync(IEnumerable<UserNotification> notifications, CancellationToken cancellationToken = default);
}
