namespace DungeonKeep.Domain.Entities;

public sealed class CharacterCampaignAssignment
{
    public Guid CharacterId { get; set; }
    public Guid CampaignId { get; set; }

    public Character? Character { get; set; }
    public Campaign? Campaign { get; set; }
}