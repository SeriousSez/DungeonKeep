namespace DungeonKeep.ApplicationService.Contracts;

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
    IReadOnlyList<string> Loot,
    IReadOnlyList<CampaignThreadDto> OpenThreads,
    IReadOnlyList<CampaignWorldNoteDto> WorldNotes,
    CampaignMapDto Map,
    IReadOnlyList<CampaignMapBoardDto> Maps,
    Guid ActiveMapId,
    string CurrentUserRole,
    IReadOnlyList<CampaignMemberDto> Members
);

public sealed record CampaignSessionDto(
    Guid Id,
    string Title,
    string Date,
    string Location,
    string Objective,
    string Threat
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
    string Content
);

public sealed record CampaignMapDto(
    string Background,
    string BackgroundImageUrl,
    IReadOnlyList<CampaignMapStrokeDto> Strokes,
    IReadOnlyList<CampaignMapIconDto> Icons,
    IReadOnlyList<CampaignMapDecorationDto> Decorations,
    IReadOnlyList<CampaignMapLabelDto> Labels,
    CampaignMapLayersDto Layers
);

public sealed record CampaignMapBoardDto(
    Guid Id,
    string Name,
    string Background,
    string BackgroundImageUrl,
    IReadOnlyList<CampaignMapStrokeDto> Strokes,
    IReadOnlyList<CampaignMapIconDto> Icons,
    IReadOnlyList<CampaignMapDecorationDto> Decorations,
    IReadOnlyList<CampaignMapLabelDto> Labels,
    CampaignMapLayersDto Layers
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
    double Rotation
);

public sealed record CampaignMapLayersDto(
    IReadOnlyList<CampaignMapStrokeDto> Rivers,
    IReadOnlyList<CampaignMapDecorationDto> MountainChains,
    IReadOnlyList<CampaignMapDecorationDto> ForestBelts
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
public sealed record CreateCampaignSessionRequest(string Title, string Date, string Location, string Objective, string Threat);
public sealed record UpdateCampaignSessionRequest(string Title, string Date, string Location, string Objective, string Threat);
public sealed record CreateCampaignNpcRequest(string Name);
public sealed record RemoveCampaignNpcRequest(string Name);
public sealed record CreateCampaignLootRequest(string Name);
public sealed record RemoveCampaignLootRequest(string Name);
public sealed record CreateCampaignWorldNoteRequest(string Title, string Category, string Content);
public sealed record UpdateCampaignWorldNoteRequest(string Title, string Category, string Content);
public sealed record DeleteCampaignWorldNoteRequest(Guid NoteId);
public sealed record UpdateCampaignMapRequest(CampaignMapDto? Map, CampaignMapLibraryDto? Library);

public sealed record CampaignInvitationEmail(
    Guid CampaignId,
    string CampaignName,
    string CampaignUrl,
    string RecipientEmail,
    string InviterDisplayName,
    string InviterEmail,
    bool RecipientAlreadyHasAccess
);
