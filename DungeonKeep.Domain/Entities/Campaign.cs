namespace DungeonKeep.Domain.Entities;

public sealed class Campaign
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Setting { get; set; } = string.Empty;
    public string Tone { get; set; } = "Heroic";
    public int LevelStart { get; set; } = 1;
    public int LevelEnd { get; set; } = 4;
    public string Hook { get; set; } = string.Empty;
    public string NextSession { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string SessionsJson { get; set; } = "[]";
    public string NpcsJson { get; set; } = "[]";
    public string LootJson { get; set; } = "[]";
    public string OpenThreadsJson { get; set; } = "[]";
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<Character> Characters { get; set; } = [];
    public List<CampaignMembership> Memberships { get; set; } = [];
}
