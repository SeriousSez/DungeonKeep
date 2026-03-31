namespace DungeonKeep.Domain.Entities;

public sealed class Campaign
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Setting { get; set; } = string.Empty;
    public string Tone { get; set; } = "Heroic";
    public string Hook { get; set; } = string.Empty;
    public string NextSession { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string OpenThreadsJson { get; set; } = "[]";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Character> Characters { get; set; } = [];
    public List<CampaignMembership> Memberships { get; set; } = [];
}
