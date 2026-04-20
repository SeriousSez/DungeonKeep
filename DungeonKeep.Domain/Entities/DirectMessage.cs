namespace DungeonKeep.Domain.Entities;

public sealed class DirectMessage
{
    public Guid Id { get; set; }
    public Guid ThreadId { get; set; }
    public Guid SenderUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTime SentAtUtc { get; set; } = DateTime.UtcNow;

    public DirectMessageThread? Thread { get; set; }
    public AppUser? Sender { get; set; }
}
