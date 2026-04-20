namespace DungeonKeep.Domain.Entities;

public sealed class DirectMessageThread
{
    public Guid Id { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime LastMessageAtUtc { get; set; } = DateTime.UtcNow;

    public List<DirectMessageParticipant> Participants { get; set; } = [];
    public List<DirectMessage> Messages { get; set; } = [];
}
