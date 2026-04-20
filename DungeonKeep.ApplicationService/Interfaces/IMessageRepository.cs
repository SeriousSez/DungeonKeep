using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.Domain.Entities;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IMessageRepository
{
    Task<IReadOnlyList<DirectMessageThread>> GetThreadsForUserAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DirectMessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default);
    Task<DirectMessageThread?> GetThreadBetweenUsersAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default);
    Task<DirectMessageThread> CreateThreadAsync(Guid initiatorUserId, Guid recipientUserId, CancellationToken cancellationToken = default);
    Task<DirectMessage> AddMessageAsync(Guid threadId, Guid senderUserId, string body, CancellationToken cancellationToken = default);
    Task MarkThreadReadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageContactDto>> GetContactsAsync(Guid userId, CancellationToken cancellationToken = default);
}
