using DungeonKeep.ApplicationService.Contracts;
using DungeonKeep.ApplicationService.Interfaces;
using DungeonKeep.Domain.Entities;
using DungeonKeep.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DungeonKeep.Infrastructure.Repositories;

public sealed class MessageRepository(DungeonKeepDbContext dbContext) : IMessageRepository
{
    public async Task<IReadOnlyList<DirectMessageThread>> GetThreadsForUserAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await dbContext.DirectMessageThreads
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Messages)
            .Where(t => t.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(t => t.LastMessageAtUtc)
            .ToListAsync(cancellationToken);
    }

    public async Task<DirectMessageThread?> GetThreadByIdAsync(Guid threadId, CancellationToken cancellationToken = default)
    {
        return await dbContext.DirectMessageThreads
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Messages).ThenInclude(m => m.Sender)
            .FirstOrDefaultAsync(t => t.Id == threadId, cancellationToken);
    }

    public async Task<DirectMessageThread?> GetThreadBetweenUsersAsync(Guid userId1, Guid userId2, CancellationToken cancellationToken = default)
    {
        return await dbContext.DirectMessageThreads
            .Include(t => t.Participants).ThenInclude(p => p.User)
            .Include(t => t.Messages).ThenInclude(m => m.Sender)
            .Where(t =>
                t.Participants.Any(p => p.UserId == userId1) &&
                t.Participants.Any(p => p.UserId == userId2) &&
                t.Participants.Count == 2)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<DirectMessageThread> CreateThreadAsync(Guid initiatorUserId, Guid recipientUserId, CancellationToken cancellationToken = default)
    {
        var thread = new DirectMessageThread
        {
            Id = Guid.NewGuid(),
            CreatedAtUtc = DateTime.UtcNow,
            LastMessageAtUtc = DateTime.UtcNow,
            Participants =
            [
                new DirectMessageParticipant { Id = Guid.NewGuid(), UserId = initiatorUserId },
                new DirectMessageParticipant { Id = Guid.NewGuid(), UserId = recipientUserId }
            ]
        };
        dbContext.DirectMessageThreads.Add(thread);
        await dbContext.SaveChangesAsync(cancellationToken);
        return (await GetThreadByIdAsync(thread.Id, cancellationToken))!;
    }

    public async Task<DirectMessage> AddMessageAsync(Guid threadId, Guid senderUserId, string body, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var message = new DirectMessage
        {
            Id = Guid.NewGuid(),
            ThreadId = threadId,
            SenderUserId = senderUserId,
            Body = body,
            SentAtUtc = now
        };
        dbContext.DirectMessages.Add(message);
        await dbContext.SaveChangesAsync(cancellationToken);

        await dbContext.DirectMessageThreads
            .Where(t => t.Id == threadId)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.LastMessageAtUtc, now), cancellationToken);

        return message;
    }

    public async Task MarkThreadReadAsync(Guid threadId, Guid userId, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        await dbContext.DirectMessageParticipants
            .Where(p => p.ThreadId == threadId && p.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.LastReadAtUtc, now), cancellationToken);
    }

    public async Task<IReadOnlyList<MessageContactDto>> GetContactsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var campaignIds = await dbContext.CampaignMemberships
            .Where(m => m.UserId == userId && m.Status == "Active")
            .Select(m => m.CampaignId)
            .Distinct()
            .ToListAsync(cancellationToken);

        var contactUserIds = await dbContext.CampaignMemberships
            .Where(m => campaignIds.Contains(m.CampaignId) && m.UserId != null && m.UserId != userId && m.Status == "Active")
            .Select(m => m.UserId!.Value)
            .Distinct()
            .ToListAsync(cancellationToken);

        var contacts = await dbContext.AppUsers
            .Where(u => contactUserIds.Contains(u.Id))
            .OrderBy(u => u.DisplayName)
            .Select(u => new MessageContactDto(u.Id, u.DisplayName))
            .ToListAsync(cancellationToken);

        return contacts;
    }
}
