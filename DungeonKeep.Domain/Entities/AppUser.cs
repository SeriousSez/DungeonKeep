namespace DungeonKeep.Domain.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public string ActivationCodeHash { get; set; } = string.Empty;
    public DateTime? ActivationCodeExpiresAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public string NpcLibraryJson { get; set; } = "[]";
    public string CustomTableLibraryJson { get; set; } = "[]";
    public string MonsterLibraryJson { get; set; } = "[]";
    public string MonsterReferenceJson { get; set; } = "[]";

    public List<AuthSession> Sessions { get; set; } = [];
    public List<CampaignMembership> CampaignMemberships { get; set; } = [];
    public List<Character> OwnedCharacters { get; set; } = [];
}