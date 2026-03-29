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
    , string Species
    , string Alignment
    , string Lifestyle
    , string PersonalityTraits
    , string Ideals
    , string Bonds
    , string Flaws
    , string Equipment
    , string AbilityScores
    , string Skills
    , string SavingThrows
    , int HitPoints
    , int ArmorClass
    , string CombatStats
    , string Spells
    , int ExperiencePoints
    , string PortraitUrl
    , string Goals
    , string Secrets
    , string SessionHistory
);

public sealed record CreateCharacterRequest(
    string Name,
    string PlayerName,
    string ClassName,
    int Level,
    string Background,
    string Notes,
    Guid? CampaignId = null
    , string Species = ""
    , string Alignment = ""
    , string Lifestyle = ""
    , string PersonalityTraits = ""
    , string Ideals = ""
    , string Bonds = ""
    , string Flaws = ""
    , string Equipment = ""
    , string AbilityScores = ""
    , string Skills = ""
    , string SavingThrows = ""
    , int HitPoints = 0
    , int ArmorClass = 0
    , string CombatStats = ""
    , string Spells = ""
    , int ExperiencePoints = 0
    , string PortraitUrl = ""
    , string Goals = ""
    , string Secrets = ""
    , string SessionHistory = ""
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

public sealed record UpdateCharacterRequest(
    string Name,
    string PlayerName,
    string ClassName,
    int Level,
    string Background,
    string Notes,
    Guid? CampaignId = null
    , string Species = ""
    , string Alignment = ""
    , string Lifestyle = ""
    , string PersonalityTraits = ""
    , string Ideals = ""
    , string Bonds = ""
    , string Flaws = ""
    , string Equipment = ""
    , string AbilityScores = ""
    , string Skills = ""
    , string SavingThrows = ""
    , int HitPoints = 0
    , int ArmorClass = 0
    , string CombatStats = ""
    , string Spells = ""
    , int ExperiencePoints = 0
    , string PortraitUrl = ""
    , string Goals = ""
    , string Secrets = ""
    , string SessionHistory = ""
);

public sealed record UpdateCharacterBackstoryRequest(string Backstory);
public sealed record UpdateCharacterStatusRequest(string Status);
public sealed record UpdateCharacterCampaignRequest(Guid? CampaignId);
