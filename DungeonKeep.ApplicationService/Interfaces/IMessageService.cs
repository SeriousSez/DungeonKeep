using DungeonKeep.ApplicationService.Contracts;

namespace DungeonKeep.ApplicationService.Interfaces;

public interface IMessageService
{
    Task<IReadOnlyList<MessageContactDto>> GetContactsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<MessageThreadSummaryDto>> GetThreadsAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<MessageThreadDto?> GetThreadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default);
    Task<MessageThreadDto?> SendMessageAsync(Guid threadId, Guid userId, SendMessageRequest request, CancellationToken cancellationToken = default);
    Task<MessageThreadDto> ComposeAsync(Guid userId, ComposeMessageRequest request, CancellationToken cancellationToken = default);
    Task MarkThreadReadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default);
}
