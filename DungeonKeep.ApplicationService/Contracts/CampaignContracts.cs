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
    IReadOnlyList<CampaignThreadDto> OpenThreads,
    string CurrentUserRole,
    IReadOnlyList<CampaignMemberDto> Members
);

public sealed record CampaignThreadDto(
    Guid Id,
    string Text,
    string Visibility
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
