namespace DungeonKeep.ApplicationService.Contracts;

public sealed record CharacterDto(
    Guid Id,
    Guid CampaignId,
    Guid[] CampaignIds,
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
    , int DeathSaveFailures
    , int DeathSaveSuccesses
    , int ArmorClass
    , string CombatStats
    , string Spells
    , int ExperiencePoints
    , string PortraitUrl
    , string DetailBackgroundImageUrl
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
    Guid? CampaignId = null,
    Guid[]? CampaignIds = null
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
    , int DeathSaveFailures = 0
    , int DeathSaveSuccesses = 0
    , int ArmorClass = 0
    , string CombatStats = ""
    , string Spells = ""
    , int ExperiencePoints = 0
    , string PortraitUrl = ""
    , string DetailBackgroundImageUrl = ""
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

public sealed record GenerateCharacterPortraitRequest(
    string Name,
    string ClassName,
    string Background,
    string Species,
    string Alignment,
    string Gender,
    string AdditionalDirection
);

public sealed record GenerateCharacterPortraitResponse(string ImageUrl);

public sealed record UpdateCharacterRequest(
    string Name,
    string PlayerName,
    string ClassName,
    int Level,
    string Background,
    string Notes,
    Guid? CampaignId = null,
    Guid[]? CampaignIds = null
    , string? Species = null
    , string? Alignment = null
    , string? Lifestyle = null
    , string? PersonalityTraits = null
    , string? Ideals = null
    , string? Bonds = null
    , string? Flaws = null
    , string? Equipment = null
    , string? AbilityScores = null
    , string? Skills = null
    , string? SavingThrows = null
    , int? HitPoints = null
    , int? DeathSaveFailures = null
    , int? DeathSaveSuccesses = null
    , int? ArmorClass = null
    , string? CombatStats = null
    , string? Spells = null
    , int? ExperiencePoints = null
    , string? PortraitUrl = null
    , string? DetailBackgroundImageUrl = null
    , string? Goals = null
    , string? Secrets = null
    , string? SessionHistory = null
);

public sealed record UpdateCharacterBackstoryRequest(string Backstory);
public sealed record UpdateCharacterStatusRequest(string Status);
public sealed record UpdateCharacterCampaignRequest(Guid? CampaignId, Guid[]? CampaignIds = null);
