namespace DungeonKeep.ApplicationService.Contracts;

public sealed record CharacterDto(
    Guid Id,
    Guid CampaignId,
    Guid? OwnerUserId,
    string OwnerDisplayName,
    string Name,
    string PlayerName,
    string ClassName,
    int Level,
    string Status,
    string Background,
    string Notes,
    string Backstory,
    DateTime CreatedAtUtc,
    bool CanEdit
);

public sealed record CreateCharacterRequest(
    string Name,
    string PlayerName,
    string ClassName,
    int Level,
    string Background,
    string Notes,
    Guid? CampaignId = null
);

public sealed record GenerateCharacterBackstoryRequest(
    string ClassName,
    string Background,
    string Species,
    string Alignment,
    string Lifestyle,
    string[] PersonalityTraits,
    string[] Ideals,
    string[] Bonds,
    string[] Flaws,
    string AdditionalDirection
);

public sealed record GenerateCharacterBackstoryResponse(string Backstory);

public sealed record UpdateCharacterBackstoryRequest(string Backstory);
public sealed record UpdateCharacterStatusRequest(string Status);
public sealed record UpdateCharacterCampaignRequest(Guid? CampaignId);
