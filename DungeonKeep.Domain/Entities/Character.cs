namespace DungeonKeep.Domain.Entities;

public sealed class Character
{
    public Guid Id { get; set; }
    public Guid? CampaignId { get; set; }
    public Guid? OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string PlayerName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public int Level { get; set; } = 1;
    public string Status { get; set; } = "Ready";
    public string Background { get; set; } = string.Empty;
    public string Notes { get; set; } = string.Empty;
    public string Backstory { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Campaign? Campaign { get; set; }
    public AppUser? OwnerUser { get; set; }
}
