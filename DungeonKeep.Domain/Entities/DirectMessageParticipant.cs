namespace DungeonKeep.Domain.Entities;

public sealed class DirectMessageParticipant
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public Guid UserId { get; set; }
    public DateTime? LastReadAtUtc { get; set; }

    public DirectMessageThread? Thread { get; set; }
    public AppUser? User { get; set; }
}
