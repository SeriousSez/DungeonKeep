namespace DungeonKeep.Domain.Entities;

public sealed class CampaignMembership
{
    public Guid Id { get; set; }
    public Guid CampaignId { get; set; }
    public Guid? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Member";
    public string Status { get; set; } = "Pending";
    public Guid? InvitedByUserId { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public Campaign? Campaign { get; set; }
    public AppUser? User { get; set; }
    public AppUser? InvitedByUser { get; set; }
}