namespace DungeonKeep.Domain.Entities;

public sealed class AppUser
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public List<AuthSession> Sessions { get; set; } = [];
    public List<CampaignMembership> CampaignMemberships { get; set; } = [];
    public List<Character> OwnedCharacters { get; set; } = [];
}