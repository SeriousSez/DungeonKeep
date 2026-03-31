namespace DungeonKeep.ApplicationService.Contracts;

public sealed record CampaignDto(
    Guid Id,
    string Name,
    string Setting,
    string Tone,
    string Hook,
    string NextSession,
    string Summary,
    DateTime CreatedAtUtc,
    int CharacterCount,
    IReadOnlyList<string> OpenThreads,
    string CurrentUserRole,
    IReadOnlyList<CampaignMemberDto> Members
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
    string Hook,
    string NextSession,
    string Summary
);

public sealed record ArchiveCampaignThreadRequest(string Thread);
public sealed record InviteCampaignMemberRequest(string Email);
