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

public sealed record CampaignInvitationEmail(
    Guid CampaignId,
    string CampaignName,
    string CampaignUrl,
    string RecipientEmail,
    string InviterDisplayName,
    string InviterEmail,
    bool RecipientAlreadyHasAccess
);
