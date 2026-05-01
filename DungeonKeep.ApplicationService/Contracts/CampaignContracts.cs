namespace DungeonKeep.ApplicationService.Contracts;

public sealed record CampaignSummaryRecord(
    Guid Id,
    string Name,
    string Setting,
    string Tone,
    int LevelStart,
    int LevelEnd,
    string Hook,
    string NextSession,
    string Summary,
    DateTime CreatedAtUtc,
    int CharacterCount,
    string SessionsJson,
    string NpcsJson,
    string OpenThreadsJson,
    string CurrentUserRole
);

public sealed record CampaignSummaryDto(
    Guid Id,
    string Name,
    string Setting,
    string Tone,
    int LevelStart,
    int LevelEnd,
    string Hook,
    string NextSession,
    string Summary,
    DateTime CreatedAtUtc,
    int CharacterCount,
    int SessionCount,
    int NpcCount,
    int OpenThreadCount,
    string CurrentUserRole
);

public sealed record CampaignDto(
    Guid Id,
    string Name,
    string Setting,
    string Tone,
    int LevelStart,
    int LevelEnd,
    string Hook,
    string NextSession,
    string Summary,
    DateTime CreatedAtUtc,
    int CharacterCount,
    IReadOnlyList<CampaignSessionDto> Sessions,
    IReadOnlyList<string> Npcs,
    IReadOnlyList<CampaignNpcDto> CampaignNpcs,
    IReadOnlyList<string> Loot,
    IReadOnlyList<CampaignThreadDto> OpenThreads,
    IReadOnlyList<CampaignWorldNoteDto> WorldNotes,
    CampaignMapDto Map,
    IReadOnlyList<CampaignMapBoardDto> Maps,
    Guid ActiveMapId,
    string CurrentUserRole,
    IReadOnlyList<CampaignMemberDto> Members
);

public sealed record CampaignNpcDto(
    Guid Id,
    string Name,
    string Title,
    string Race,
    string ClassOrRole,
    string Faction,
    string Occupation,
    string Age,
    string Gender,
    string Alignment,
    string CurrentStatus,
    string Location,
    string ShortDescription,
    string Appearance,
    IReadOnlyList<string> PersonalityTraits,
    IReadOnlyList<string> Ideals,
    IReadOnlyList<string> Bonds,
    IReadOnlyList<string> Flaws,
    string Motivations,
    string Goals,
    string Fears,
    IReadOnlyList<string> Secrets,
    IReadOnlyList<string> Mannerisms,
    string VoiceNotes,
    string Backstory,
    string Notes,
    string CombatNotes,
    string StatBlockReference,
    IReadOnlyList<string> Tags,
    IReadOnlyList<CampaignNpcRelationshipDto> Relationships,
    IReadOnlyList<string> QuestLinks,
    IReadOnlyList<string> SessionAppearances,
    IReadOnlyList<string> Inventory,
    string ImageUrl,
    string Hostility,
    bool IsAlive,
    bool IsImportant,
    string UpdatedAt
);

public sealed record CampaignNpcRelationshipDto(
    Guid Id,
    Guid TargetNpcId,
    string RelationshipType,
    string Description
);

public sealed record CampaignSessionDto(
    Guid Id,
    string Title,
    string Date,
    string Location,
    string Objective,
    string Threat,
    bool IsRevealedToPlayers = false
);

public sealed record CampaignThreadDto(
    Guid Id,
    string Text,
    string Visibility
);

public sealed record CampaignWorldNoteDto(
    Guid Id,
    string Title,
    string Category,
    string Content,
    bool IsRevealedToPlayers = false
);

public sealed record CampaignMapDto(
    string Background,
    string BackgroundImageUrl,
    double GridColumns,
    double GridRows,
    string GridColor,
    double GridOffsetX,
    double GridOffsetY,
    IReadOnlyList<CampaignMapStrokeDto> Strokes,
    IReadOnlyList<CampaignMapWallDto> Walls,
    IReadOnlyList<CampaignMapIconDto> Icons,
    IReadOnlyList<CampaignMapTokenDto> Tokens,
    IReadOnlyList<CampaignMapDecorationDto> Decorations,
    IReadOnlyList<CampaignMapLabelDto> Labels,
    CampaignMapLayersDto Layers,
    IReadOnlyList<CampaignMapVisionMemoryDto> VisionMemory,
    bool VisionEnabled = true,
    bool MembersCanViewAnytime = false
);

public sealed record CampaignMapBoardDto(
    Guid Id,
    string Name,
    string Background,
    string BackgroundImageUrl,
    double GridColumns,
    double GridRows,
    string GridColor,
    double GridOffsetX,
    double GridOffsetY,
    IReadOnlyList<CampaignMapStrokeDto> Strokes,
    IReadOnlyList<CampaignMapWallDto> Walls,
    IReadOnlyList<CampaignMapIconDto> Icons,
    IReadOnlyList<CampaignMapTokenDto> Tokens,
    IReadOnlyList<CampaignMapDecorationDto> Decorations,
    IReadOnlyList<CampaignMapLabelDto> Labels,
    CampaignMapLayersDto Layers,
    IReadOnlyList<CampaignMapVisionMemoryDto> VisionMemory,
    bool VisionEnabled = true,
    bool MembersCanViewAnytime = false
);

public sealed record CampaignMapLibraryDto(
    Guid ActiveMapId,
    IReadOnlyList<CampaignMapBoardDto> Maps
);

public sealed record CampaignMapStrokeDto(
    Guid Id,
    string Color,
    int Width,
    IReadOnlyList<CampaignMapPointDto> Points
);

public sealed record CampaignMapWallDto(
    Guid Id,
    string Color,
    int Width,
    IReadOnlyList<CampaignMapPointDto> Points,
    bool? BlocksVision,
    bool? BlocksMovement
);

public sealed record CampaignMapPointDto(
    double X,
    double Y
);

public sealed record CampaignMapIconDto(
    Guid Id,
    string Type,
    string Label,
    double X,
    double Y
);

public sealed record CampaignMapTokenDto(
    Guid Id,
    string Name,
    string ImageUrl,
    double X,
    double Y,
    double Size,
    string Note,
    Guid? AssignedUserId,
    Guid? AssignedCharacterId,
    long MoveRevision
);

public sealed record CampaignMapTokenMovedDto(
    Guid CampaignId,
    Guid MapId,
    Guid InitiatedByUserId,
    CampaignMapTokenDto Token
);

public sealed record CampaignMapDecorationDto(
    Guid Id,
    string Type,
    string? Color,
    double X,
    double Y,
    double Scale,
    double Rotation,
    double Opacity
);

public sealed record CampaignMapLabelDto(
    Guid Id,
    string Text,
    string Tone,
    double X,
    double Y,
    double Rotation,
    CampaignMapLabelStyleDto? Style
);

public sealed record CampaignMapLabelStyleDto(
    string Color,
    string BackgroundColor,
    string BorderColor,
    string FontFamily,
    double FontSize,
    int FontWeight,
    double LetterSpacing,
    string FontStyle,
    string TextTransform,
    double BorderWidth,
    double BorderRadius,
    double PaddingX,
    double PaddingY,
    string TextShadow,
    string BoxShadow,
    double Opacity
);

public sealed record CampaignMapLayersDto(
    IReadOnlyList<CampaignMapStrokeDto> Rivers,
    IReadOnlyList<CampaignMapDecorationDto> MountainChains,
    IReadOnlyList<CampaignMapDecorationDto> ForestBelts
);

public sealed record CampaignMapVisionMemoryDto(
    string Key,
    IReadOnlyList<CampaignMapVisionPolygonDto> Polygons,
    CampaignMapPointDto? LastOrigin,
    string LastPolygonHash,
    long Revision
);

public sealed record CampaignMapVisionUpdatedDto(
    Guid CampaignId,
    Guid MapId,
    Guid InitiatedByUserId,
    CampaignMapVisionMemoryDto Memory
);

public sealed record CampaignMapTokenMoveResultDto(
    CampaignMapTokenMovedDto TokenMoved,
    CampaignMapVisionUpdatedDto? VisionUpdated
);

public sealed record CampaignMapVisionPolygonDto(
    IReadOnlyList<CampaignMapPointDto> Points
);

public sealed record CampaignMemberDto(
    Guid? UserId,
    string Email,
    string DisplayName,
    string Role,
    string Status
);

public sealed record CreateCampaignRequest(
    string Name,
    string Setting,
    string Tone,
    int LevelStart,
    int LevelEnd,
    string Hook,
    string NextSession,
    string Summary
);

public sealed record UpdateCampaignRequest(
    string Name,
    string Setting,
    string Tone,
    int LevelStart,
    int LevelEnd,
    string Hook,
    string NextSession,
    string Summary
);

public sealed record CreateCampaignThreadRequest(string Text, string Visibility);
public sealed record UpdateCampaignThreadRequest(string Text, string Visibility);
public sealed record ArchiveCampaignThreadRequest(Guid ThreadId);
public sealed record InviteCampaignMemberRequest(string Email);
public sealed record RemoveCampaignMemberRequest(Guid UserId);
public sealed record CreateCampaignSessionRequest(string Title, string Date, string Location, string Objective, string Threat);
public sealed record UpdateCampaignSessionRequest(string Title, string Date, string Location, string Objective, string Threat);
public sealed record CreateCampaignNpcRequest(string Name);
public sealed record RemoveCampaignNpcRequest(string Name);
public sealed record SaveCampaignNpcRequest(CampaignNpcDto Npc);
public sealed record CreateCampaignLootRequest(string Name);
public sealed record RemoveCampaignLootRequest(string Name);
public sealed record CreateCampaignWorldNoteRequest(string Title, string Category, string Content);
public sealed record UpdateCampaignWorldNoteRequest(string Title, string Category, string Content);
public sealed record SetSessionVisibilityRequest(bool IsRevealedToPlayers);
public sealed record SetWorldNoteVisibilityRequest(bool IsRevealedToPlayers);
public sealed record DeleteCampaignWorldNoteRequest(Guid NoteId);
public sealed record UpdateCampaignMapRequest(CampaignMapDto? Map, CampaignMapLibraryDto? Library);
public sealed record MoveCampaignMapTokenRequest(Guid MapId, double X, double Y, long MoveRevision, CampaignMapVisionMemoryDto? VisionMemory);
public sealed record ResetCampaignMapVisionRequest(Guid MapId, string? Key);
public sealed record UpdateCampaignMapVisionRequest(Guid MapId, CampaignMapVisionMemoryDto Memory);

public sealed record CampaignInvitationEmail(
    Guid CampaignId,
    string CampaignName,
    string CampaignUrl,
    string RecipientEmail,
    string InviterDisplayName,
    string InviterEmail,
    bool RecipientAlreadyHasAccess
);
