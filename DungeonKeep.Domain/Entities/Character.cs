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

    // New D&D fields
    public string Species { get; set; } = string.Empty;
    public string Alignment { get; set; } = string.Empty;
    public string Lifestyle { get; set; } = string.Empty;
    public string PersonalityTraits { get; set; } = string.Empty; // JSON or delimited
    public string Ideals { get; set; } = string.Empty; // JSON or delimited
    public string Bonds { get; set; } = string.Empty; // JSON or delimited
    public string Flaws { get; set; } = string.Empty; // JSON or delimited
    public string Equipment { get; set; } = string.Empty; // JSON or delimited
    public string AbilityScores { get; set; } = string.Empty; // JSON: {str:10, dex:12,...}
    public string Skills { get; set; } = string.Empty; // JSON or delimited
    public string SavingThrows { get; set; } = string.Empty; // JSON or delimited
    public int HitPoints { get; set; } = 0;
    public int ArmorClass { get; set; } = 0;
    public string CombatStats { get; set; } = string.Empty; // JSON or delimited
    public string Spells { get; set; } = string.Empty; // JSON or delimited
    public int ExperiencePoints { get; set; } = 0;
    public string PortraitUrl { get; set; } = string.Empty;
    public string Goals { get; set; } = string.Empty; // JSON or delimited
    public string Secrets { get; set; } = string.Empty; // JSON or delimited
    public string SessionHistory { get; set; } = string.Empty; // JSON or delimited

    public Campaign? Campaign { get; set; }
    public AppUser? OwnerUser { get; set; }
}
